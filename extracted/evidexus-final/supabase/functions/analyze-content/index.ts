import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  enforceUsageLimit,
  extractJsonContent,
  handleHttpError,
  jsonResponse,
  logQuery,
  parseJsonBody,
  requireAuth,
  requireString,
  withQueryId,
} from "../_shared/security.ts";

const systemPrompt = `You are a scientific evidence evaluator for health-related content. Your role is to analyze health claims objectively and present a neutral, evidence-based assessment.

CRITICAL RULES:
- You do NOT give medical advice
- You do NOT recommend treatments, food, supplements, or medicines
- You do NOT diagnose or predict outcomes
- You use neutral, evidence-based language only
- You present information about scientific evidence, not personal guidance
- You NEVER make promises or give consumer health advice

When analyzing content, you must return a JSON object with this exact structure:
{
  "summary": {
    "topicCategory": "Category of the health topic (e.g., Nutrition, Supplements, Exercise, Mental Health, Alternative Medicine)",
    "contentType": "Type of content (e.g., Article, Social Media Post, Video Transcript, Blog Post)"
  },
  "claims": [
    "List each distinct health claim made in the content as a neutral statement"
  ],
  "assessments": [
    {
      "claim": "The specific claim being assessed",
      "evidenceLevel": "One of: Strong | Moderate | Weak | Unsupported (categorical only, no numbers)",
      "evidenceType": "One of: Human RCTs | Human Observational | Systematic Review | Animal Studies | In-vitro | Expert Consensus | Anecdotal | No Evidence",
      "alignment": "One of: Aligned with consensus | Partially aligned | Unclear | Contradicts consensus",
      "explanation": "2-3 sentence neutral explanation of the evidence status",
      "riskLevel": "One of: Low | Medium | High - risk if this claim is misinterpreted or followed blindly",
      "uncertainty": "Key limitations, gaps in evidence, or conflicting findings for this specific claim",
      "references": ["Array of reference sources like: PubMed, WHO, CDC, Cochrane, NIH, or specific study types"]
    }
  ],
  "riskContext": "A paragraph explaining the overall potential risk if these claims are followed without verification. Focus on what could happen, not what should be done. Be specific about potential harms.",
  "scientificContext": "A paragraph providing high-level scientific context about what current research generally agrees on regarding this topic area."
}

IMPORTANT OUTPUT RULES:
- Use only categorical labels (Strong/Moderate/Weak/Unsupported, Low/Medium/High)
- Never use numerical scores or percentages
- Keep language neutral and professional
- No emojis or casual language
- Always include uncertainty and references for each claim

Always respond with valid JSON only, no additional text.`;

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/v\/)([^?\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function isYouTubeUrl(content: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(content.trim());
}

async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    const langCodes = ["en", "en-US", "en-GB", "a.en"];

    for (const lang of langCodes) {
      try {
        const transcriptUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv3`;
        const response = await fetch(transcriptUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (!response.ok) continue;

        const text = await response.text();
        if (!text || text.length <= 100) continue;

        const textMatches = text.match(/<text[^>]*>([^<]*)<\/text>/g);
        if (!textMatches?.length) continue;

        const transcript = textMatches
          .map((entry) => entry.replace(/<[^>]*>/g, ""))
          .join(" ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim();

        if (transcript.length > 50) return transcript;
      } catch {
        // Continue trying fallback languages
      }
    }

    const fallback = await fetch(`https://youtubetranscript.com/?server_vid2=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!fallback.ok) return null;
    const fallbackText = await fallback.text();
    const transcriptMatch = fallbackText.match(/<text[^>]*>([^<]*)<\/text>/g);
    if (!transcriptMatch) return null;

    const transcript = transcriptMatch
      .map((entry) => entry.replace(/<[^>]*>/g, ""))
      .join(" ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    return transcript.length > 50 ? transcript : null;
  } catch (error) {
    console.error("Error in transcript extraction:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { admin, userId } = await requireAuth(req);
    await enforceUsageLimit(admin, userId);

    const { content } = await parseJsonBody<{ content?: unknown }>(req, 24_000);
    const trimmedContent = requireString(content, "Content", 10, 20_000);

    let contentToAnalyze = trimmedContent;
    let contentType = "Text";

    if (isYouTubeUrl(trimmedContent)) {
      const videoId = extractYouTubeVideoId(trimmedContent);
      if (!videoId) {
        return jsonResponse({
          error: "Invalid YouTube URL format. Please check the link and try again, or paste the video transcript directly.",
          requiresManualTranscript: false,
        }, 400);
      }

      const transcript = await fetchYouTubeTranscript(videoId);
      if (!transcript) {
        return jsonResponse({
          error: "Transcript not available for this video. The video may not have captions, or captions may be disabled.",
          requiresManualTranscript: true,
        }, 400);
      }

      contentToAnalyze = transcript;
      contentType = "Video Transcript";
    }

    if (contentToAnalyze.length < 20) {
      return jsonResponse({
        error: "Insufficient content for analysis. Please provide more detailed text or a longer transcript.",
        requiresManualTranscript: isYouTubeUrl(trimmedContent),
      }, 400);
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return jsonResponse({ error: "Analysis service is not configured. Please contact support." }, 500);
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${geminiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze the following health-related content (${contentType}) and provide a structured evidence assessment:\n\n${contentToAnalyze}` },
        ],
        temperature: 0.3,
      }),
    });

    if (response.status === 429) {
      return jsonResponse({ error: "Analysis rate limit exceeded. Please wait a moment and try again." }, 429);
    }
    if (response.status === 402) {
      return jsonResponse({ error: "Analysis service temporarily unavailable. Please try again later." }, 402);
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return jsonResponse({ error: "Analysis failed. Please try again or simplify your content." }, 500);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiResponse) {
      return jsonResponse({ error: "No analysis could be generated. Please try different content." }, 500);
    }

    const analysis = JSON.parse(extractJsonContent(aiResponse));
    if (!analysis.summary || !analysis.claims || !analysis.assessments) {
      return jsonResponse({ error: "Failed to parse analysis results. Please try again." }, 500);
    }

    analysis.assessments = analysis.assessments.map((assessment: Record<string, unknown>) => ({
      claim: assessment.claim || "Unknown claim",
      evidenceLevel: assessment.evidenceLevel || "Unclear",
      evidenceType: assessment.evidenceType || "Not specified",
      alignment: assessment.alignment || "Unclear",
      explanation: assessment.explanation || "No explanation available",
      riskLevel: assessment.riskLevel || "Medium",
      uncertainty: assessment.uncertainty || "No specific limitations noted",
      references: Array.isArray(assessment.references) ? assessment.references : ["General literature"],
    }));

    const queryId = await logQuery(admin, {
      userId,
      toolType: "content_analysis",
      queryText: trimmedContent.slice(0, 500),
      responseData: analysis,
    });

    return jsonResponse(withQueryId(analysis, queryId));
  } catch (error) {
    return handleHttpError(error, "An unexpected error occurred. Please try again.");
  }
});
