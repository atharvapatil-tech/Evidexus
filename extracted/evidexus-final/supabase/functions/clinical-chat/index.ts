/**
 * EVIDEXUS — CLINICAL EVIDENCE ENGINE v2
 *
 * Pipeline (moat = retrieval + grading logic, not AI memory):
 *   1. Query Analysis   — extract terms, detect type, India flag
 *   2. PubMed Retrieval — real abstracts via E-utilities API
 *   3. Evidence Grading — Oxford Level I–V assigned by CODE
 *   4. Synthesis        — Gemini writes from retrieved evidence only
 *   5. Trust Layer      — strip hallucinations, enforce schema
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  enforceUsageLimit,
  handleHttpError,
  jsonResponse,
  logQuery,
  parseJsonBody,
  requireAuth,
  requireString,
  withQueryId,
} from "../_shared/security.ts";

// ─── STEP 1: QUERY ANALYSIS ──────────────────────────────────────────────────

function analyzeQuery(query: string) {
  const q = query.toLowerCase();

  const indiaKeywords = ["india","indian","icmr","aiims","cdsco","dengue","malaria","typhoid",
    "tuberculosis"," tb ","ntep","rntcp","naco","hiv","leprosy","kala-azar","snakebite",
    "cholera","chikungunya","leptospirosis","scrub typhus","amr","generic","ayurvedic","ayush"];
  const isIndiaRelevant = indiaKeywords.some(k => q.includes(k));

  let queryType = "general";
  if (/treat|manag|therap|drug|medic|prescri|first.?line/i.test(query)) queryType = "treatment";
  else if (/diagnos|present|symptom|sign|workup|investig/i.test(query)) queryType = "diagnosis";
  else if (/dose|dosing|dosage|how much|frequency|mg|mcg/i.test(query)) queryType = "dosing";
  else if (/interact|combine|together|safe with/i.test(query)) queryType = "interaction";

  const stopWords = new Set(["a","an","the","is","are","was","were","be","been","have","has",
    "had","do","does","did","will","would","could","should","may","might","can","how","what",
    "when","where","who","which","that","this","and","but","or","to","of","in","on","at","by",
    "with","about","for","from","than","patient","patients","year","years","old","male","female"]);

  const words = query.toLowerCase().replace(/[^a-z0-9\s-]/g,"").split(/\s+/);
  const clinicalTerms = words.filter(w => w.length > 3 && !stopWords.has(w));

  let pubmedQuery = clinicalTerms.slice(0,5).join(" ");
  if (queryType === "treatment") pubmedQuery += " treatment management";
  if (queryType === "dosing") pubmedQuery += " dosing pharmacokinetics";
  if (queryType === "diagnosis") pubmedQuery += " diagnosis clinical";
  if (isIndiaRelevant) pubmedQuery += " India";

  return { isIndiaRelevant, queryType, pubmedQuery };
}

// ─── STEP 2: PUBMED RETRIEVAL ─────────────────────────────────────────────────

async function fetchFromPubMed(searchQuery: string, maxResults = 8) {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=${maxResults}&sort=relevance&retmode=json`;
    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) return [];
    const searchData = await searchResp.json();
    const pmids: string[] = searchData.esearchresult?.idlist ?? [];
    if (pmids.length === 0) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=json`;
    const summaryResp = await fetch(summaryUrl);
    if (!summaryResp.ok) return [];
    const summaryData = await summaryResp.json();

    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(",")}&rettype=abstract&retmode=xml`;
    const fetchResp = await fetch(fetchUrl);
    const xmlText = fetchResp.ok ? await fetchResp.text() : "";

    const articles = [];
    for (const pmid of pmids) {
      const summary = summaryData.result?.[pmid];
      if (!summary) continue;

      let abstract = "";
      const abstractRegex = new RegExp(`<PMID[^>]*>${pmid}</PMID>[\\s\\S]*?<AbstractText[^>]*>([\\s\\S]*?)</AbstractText>`,"i");
      const match = xmlText.match(abstractRegex);
      if (match?.[1]) {
        abstract = match[1].replace(/<[^>]*>/g,"").trim();
        if (abstract.length > 600) abstract = abstract.substring(0,597) + "...";
      }

      const authorsArr = summary.authors ?? [];
      const authorNames = authorsArr.slice(0,3).map((a: {name:string}) => a.name).join(", ");
      const authors = authorsArr.length > 3 ? `${authorNames} et al.` : (authorNames || "Unknown");
      const pubTypes: string[] = summary.pubtype ?? [];
      const year = parseInt(summary.pubdate ?? "") || new Date().getFullYear();
      const { evidenceLevel, studyType } = gradeEvidence(pubTypes);

      articles.push({
        pmid, title: summary.title ?? "Untitled", authors,
        journal: summary.fulljournalname ?? summary.source ?? "Unknown Journal",
        year, abstract, pubTypes, evidenceLevel, studyType,
      });
    }
    return articles;
  } catch (err) {
    console.error("PubMed fetch error:", err);
    return [];
  }
}

// ─── STEP 3: EVIDENCE GRADING — CODE LOGIC, NOT AI ───────────────────────────

function gradeEvidence(pubTypes: string[]): { evidenceLevel: string; studyType: string } {
  const t = pubTypes.map(p => p.toLowerCase());
  if (t.some(p => p.includes("meta-analysis"))) return { evidenceLevel:"I", studyType:"Meta-Analysis" };
  if (t.some(p => p.includes("systematic review"))) return { evidenceLevel:"I", studyType:"Systematic Review" };
  if (t.some(p => p.includes("randomized controlled trial"))) return { evidenceLevel:"II", studyType:"RCT" };
  if (t.some(p => p.includes("clinical trial"))) return { evidenceLevel:"II", studyType:"Clinical Trial" };
  if (t.some(p => p.includes("practice guideline") || p.includes("guideline"))) return { evidenceLevel:"II", studyType:"Clinical Guideline" };
  if (t.some(p => p.includes("comparative study") || p.includes("cohort"))) return { evidenceLevel:"III", studyType:"Cohort Study" };
  if (t.some(p => p.includes("observational"))) return { evidenceLevel:"III", studyType:"Observational Study" };
  if (t.some(p => p.includes("review"))) return { evidenceLevel:"IV", studyType:"Review Article" };
  if (t.some(p => p.includes("case report") || p.includes("case series"))) return { evidenceLevel:"IV", studyType:"Case Report/Series" };
  return { evidenceLevel:"V", studyType:"Research Article" };
}

function computeOverallEvidenceLevel(articles: Array<{evidenceLevel:string}>) {
  if (articles.length === 0) return "Level V — Expert Opinion";
  const best = Math.min(...articles.map(a => parseInt(a.evidenceLevel)||5));
  const names: Record<number,string> = {
    1:"Level I — Meta-analyses / Systematic Reviews / RCTs",
    2:"Level II — Clinical Trials / Guidelines",
    3:"Level III — Cohort / Observational Studies",
    4:"Level IV — Reviews / Case Series",
    5:"Level V — Expert Opinion",
  };
  return names[best] ?? "Level V — Expert Opinion";
}

// ─── STEP 4: INDIA GUIDELINES ────────────────────────────────────────────────

function getIndianGuidelineUrls(query: string): string[] {
  const q = query.toLowerCase();
  const urls = [];
  if (/tb|tuberculosis|ntep/.test(q)) urls.push("https://tbcindia.mohfw.gov.in/");
  if (/hiv|aids|art|naco/.test(q)) urls.push("https://naco.gov.in/");
  if (/dengue|malaria|vector/.test(q)) urls.push("https://ncvbdc.mohfw.gov.in/");
  if (/antimicrobial|antibiotic|amr/.test(q)) urls.push("https://www.icmr.gov.in/");
  if (urls.length === 0) urls.push("https://www.icmr.gov.in/","https://main.mohfw.gov.in/");
  return [...new Set(urls)];
}

// ─── STEP 5: SYNTHESIS PROMPT ────────────────────────────────────────────────

function buildSynthesisPrompt(query: string, articles: Array<Record<string,unknown>>, indianUrls: string[], indiaContext: boolean) {
  const hasEvidence = articles.length > 0;
  const articleText = hasEvidence
    ? articles.map((a,i) =>
        `[${i+1}] PMID:${a.pmid} | ${a.studyType} (Oxford Level ${a.evidenceLevel})\nTitle: ${a.title}\nAuthors: ${a.authors} | ${a.journal} (${a.year})\nAbstract: ${a.abstract || "Not available"}`
      ).join("\n\n")
    : "No PubMed articles retrieved for this specific query.";

  return `You are Evidexus Clinical Evidence Engine. Answer ONLY from the retrieved evidence below. Do not add information unsupported by these articles.

RETRIEVED EVIDENCE (${articles.length} verified PubMed articles):
${articleText}

${indiaContext && indianUrls.length > 0 ? `INDIAN GUIDELINES: ${indianUrls.join(", ")}` : ""}

CLINICAL QUERY: ${query}

${!hasEvidence ? "IMPORTANT: No PubMed evidence was retrieved. Answer from established medical knowledge but set confidence to Low and state evidence was not retrieved in evidence_note." : ""}

Return ONLY valid JSON — no markdown, no preamble:
{
  "clinical_summary": "2-3 sentences of clinical context based on the evidence",
  "first_line_treatment": "specific recommendation with drug+dose+route+frequency, cite article number e.g. [1]",
  "alternatives": ["second-line option 1 with rationale", "option 2"],
  "dosage": "detailed dosing: drug, dose, route, frequency, duration, titration — cite source",
  "contraindications": ["specific contraindication from evidence [cite article]", "..."],
  "clinical_reasoning": "3-5 sentences citing specific articles e.g. [1][3] demonstrated... [2] showed...",
  "india_context": "ICMR/CDSCO guidelines, Indian brands, cost-sensitive alternatives, Indian epidemiology, AMR patterns",
  "evidence_note": "Based on N retrieved PubMed articles. Highest level: [Level X — type]. Key study: [title only, no PMID]. ${!hasEvidence ? "Evidence not retrieved from literature for this query." : ""}",
  "confidence": "${hasEvidence ? "High if Level I-II retrieved; Moderate if Level III; Low if Level IV-V" : "Low"}"
}`;
}

// ─── TRUST LAYER ─────────────────────────────────────────────────────────────

const fallback = {
  clinical_summary: "Unable to generate structured clinical response.",
  first_line_treatment: "Consult primary literature or specialist.",
  alternatives: [], dosage: "Not available",
  contraindications: ["Review patient history before any treatment decision"],
  clinical_reasoning: "Unable to retrieve sufficient evidence. Please rephrase or consult primary literature.",
  india_context: "Not available.", evidence_note: "Evidence not retrieved.", confidence: "Low",
};

function applyTrust(parsed: Record<string,unknown>, query: string) {
  parsed.clinical_summary = parsed.clinical_summary || fallback.clinical_summary;
  parsed.first_line_treatment = parsed.first_line_treatment || fallback.first_line_treatment;
  parsed.alternatives = Array.isArray(parsed.alternatives) ? parsed.alternatives : [];
  parsed.dosage = parsed.dosage || fallback.dosage;
  parsed.contraindications = Array.isArray(parsed.contraindications) && (parsed.contraindications as unknown[]).length > 0
    ? parsed.contraindications : ["Review patient history before any treatment decision"];
  parsed.clinical_reasoning = parsed.clinical_reasoning || fallback.clinical_reasoning;
  parsed.india_context = parsed.india_context || "";
  parsed.evidence_note = parsed.evidence_note || "Evidence limited";
  parsed.confidence = ["High","Moderate","Low"].includes(parsed.confidence as string) ? parsed.confidence : "Low";
  parsed.query = query;

  // Strip fabricated PMIDs/DOIs from text fields
  const suspicious = /PMID:\s*\d{7,8}(?!\s*\|)|et\s+al\.\s*\(\d{4}\)|DOI:\s*10\.\d+/gi;
  for (const f of ["evidence_note","clinical_reasoning"]) {
    if (typeof parsed[f] === "string")
      parsed[f] = (parsed[f] as string).replace(suspicious,"[citation removed]");
  }
  return parsed;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { admin, userId } = await requireAuth(req);
    await enforceUsageLimit(admin, userId);

    const { query, indiaContext } = await parseJsonBody<{ query?: unknown; indiaContext?: unknown }>(req, 8_000);
    const safeQuery = requireString(query, "Query", 1, 2_000);
    const useIndia = indiaContext === true;

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) return jsonResponse({ error: "AI service not configured" }, 500);

    // ── 1. Analyze ──────────────────────────────────────────────────────────
    const { isIndiaRelevant, pubmedQuery } = analyzeQuery(safeQuery);
    const indiaMode = useIndia || isIndiaRelevant;

    // ── 2. Retrieve real PubMed evidence ────────────────────────────────────
    console.log(`[clinical-chat] PubMed query: "${pubmedQuery}"`);
    const [articles, indianUrls] = await Promise.all([
      fetchFromPubMed(pubmedQuery, 8),
      Promise.resolve(indiaMode ? getIndianGuidelineUrls(safeQuery) : []),
    ]);
    console.log(`[clinical-chat] Retrieved ${articles.length} articles`);

    // ── 3. Grade (already done per-article above) ───────────────────────────
    const overallLevel = computeOverallEvidenceLevel(articles);

    // ── 4. Synthesize ───────────────────────────────────────────────────────
    const prompt = buildSynthesisPrompt(safeQuery, articles, indianUrls, indiaMode);
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 3000 },
        }),
      }
    );

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      console.error("Gemini error:", geminiResp.status, errText.slice(0,200));
      return jsonResponse({ error: "AI synthesis error" }, 500);
    }

    const geminiData = await geminiResp.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // ── 5. Parse + trust layer ──────────────────────────────────────────────
    let parsed: Record<string,unknown>;
    try {
      parsed = JSON.parse(rawText.replace(/```json\n?|\n?```/g,"").trim());
    } catch {
      parsed = { ...fallback };
    }
    parsed = applyTrust(parsed, safeQuery);

    // ── 6. Attach real verified sources ────────────────────────────────────
    const sources = articles.map(a => ({
      title: a.title, authors: a.authors, journal: a.journal, year: a.year,
      pmid: a.pmid, url: `https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`,
      evidenceLevel: a.evidenceLevel, studyType: a.studyType,
    }));

    const final = { ...parsed, sources, evidence_level: overallLevel };

    // ── 7. Log + return ─────────────────────────────────────────────────────
    const queryId = await logQuery(admin, {
      userId, toolType: "clinical_chat", queryText: safeQuery,
      responseData: final as Record<string,unknown>,
    });

    return jsonResponse(withQueryId(final, queryId));

  } catch (error) {
    return handleHttpError(error, "Clinical AI service error");
  }
});
