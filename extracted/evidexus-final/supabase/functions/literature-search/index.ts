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

const PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
const PUBMED_SUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  abstract: string;
  pubType: string[];
}

async function searchPubMed(query: string, maxResults = 10): Promise<string[]> {
  const params = new URLSearchParams({
    db: "pubmed",
    term: query,
    retmax: String(maxResults),
    sort: "relevance",
    retmode: "json",
  });

  const response = await fetch(`${PUBMED_SEARCH_URL}?${params}`);
  if (!response.ok) throw new Error("PubMed search failed");
  const data = await response.json();
  return data.esearchresult?.idlist || [];
}

async function fetchArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return [];

  const summaryParams = new URLSearchParams({ db: "pubmed", id: pmids.join(","), retmode: "json" });
  const summaryResponse = await fetch(`${PUBMED_SUMMARY_URL}?${summaryParams}`);
  if (!summaryResponse.ok) throw new Error("PubMed summary fetch failed");
  const summaryData = await summaryResponse.json();

  const fetchParams = new URLSearchParams({ db: "pubmed", id: pmids.join(","), rettype: "abstract", retmode: "xml" });
  const fetchResponse = await fetch(`${PUBMED_FETCH_URL}?${fetchParams}`);
  if (!fetchResponse.ok) throw new Error("PubMed abstract fetch failed");
  const xmlText = await fetchResponse.text();

  return pmids.flatMap((pmid) => {
    const summary = summaryData.result?.[pmid];
    if (!summary) return [];

    const abstractRegex = new RegExp(`<PMID[^>]*>${pmid}</PMID>[\\s\\S]*?<AbstractText[^>]*>([\\s\\S]*?)</AbstractText>`, "i");
    const abstractMatch = xmlText.match(abstractRegex);
    let abstract = abstractMatch?.[1]?.replace(/<[^>]*>/g, "").trim() || "";
    if (abstract.length > 500) abstract = `${abstract.substring(0, 497)}...`;

    const authors = summary.authors?.slice(0, 3).map((author: { name: string }) => author.name).join(", ");
    const authorString = summary.authors?.length > 3 ? `${authors} et al.` : authors || "Unknown";
    const year = parseInt(summary.pubdate || "", 10) || new Date().getFullYear();

    return [{
      pmid,
      title: summary.title || "Untitled",
      authors: authorString,
      journal: summary.fulljournalname || summary.source || "Unknown Journal",
      year,
      abstract,
      pubType: summary.pubtype || [],
    }];
  });
}

function classifyStudyType(pubTypes: string[]) {
  const types = pubTypes.map((type) => type.toLowerCase());
  if (types.some((type) => type.includes("meta-analysis"))) return "Meta-Analysis";
  if (types.some((type) => type.includes("systematic review"))) return "Systematic Review";
  if (types.some((type) => type.includes("randomized controlled"))) return "RCT";
  if (types.some((type) => type.includes("clinical trial"))) return "Clinical Trial";
  if (types.some((type) => type.includes("review"))) return "Review";
  if (types.some((type) => type.includes("guideline") || type.includes("practice guideline"))) return "Guideline";
  if (types.some((type) => type.includes("case report"))) return "Case Report";
  if (types.some((type) => type.includes("observational") || type.includes("cohort"))) return "Cohort Study";
  return "Research Article";
}

function assignEvidenceLevel(type: string) {
  switch (type) {
    case "Meta-Analysis":
    case "Systematic Review":
      return "I";
    case "RCT":
      return "II";
    case "Cohort Study":
    case "Clinical Trial":
      return "III";
    case "Case Report":
      return "IV";
    default:
      return "V";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admin, userId } = await requireAuth(req);
    await enforceUsageLimit(admin, userId);

    const { query } = await parseJsonBody<{ query?: unknown }>(req, 2_000);
    const searchQuery = requireString(query, "Search query", 3, 300);

    const pmids = await searchPubMed(searchQuery, 10);
    if (pmids.length === 0) {
      const emptyResult = {
        query: searchQuery,
        totalResults: 0,
        results: [],
        summary: "No studies found for this query. Try broadening your search terms.",
      };
      const queryId = await logQuery(admin, {
        userId,
        toolType: "literature_search",
        queryText: searchQuery,
        responseData: emptyResult,
      });
      return jsonResponse(withQueryId(emptyResult, queryId));
    }

    const articles = await fetchArticleDetails(pmids);
    const results = articles.map((article, index) => {
      const studyType = classifyStudyType(article.pubType);
      const evidenceLevel = assignEvidenceLevel(studyType);
      return {
        title: article.title,
        authors: article.authors,
        journal: article.journal,
        year: article.year,
        type: studyType,
        source: "PubMed",
        abstract: article.abstract || "Abstract not available.",
        evidenceLevel,
        sampleSize: "See full text",
        keyFindings: article.abstract ? `${article.abstract.substring(0, 150)}${article.abstract.length > 150 ? "..." : ""}` : "See full text for details.",
        pmid: article.pmid,
        relevanceScore: 1 - index * 0.08,
      };
    });

    let summary = `Found ${results.length} studies from PubMed for "${searchQuery}".`;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiApiKey && results.length > 0) {
      try {
        const studyList = results.slice(0, 5).map((result) => `- ${result.title} (${result.type}, ${result.year})`).join("\n");
        const aiResponse = await fetch(, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${geminiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "You are a medical librarian. Provide a 2-3 sentence synthesis of the evidence landscape based on these real PubMed results. Be factual and neutral. Do not add information beyond what these studies suggest.",
              },
              {
                role: "user",
                content: `Query: "${searchQuery}"\n\nStudies found:\n${studyList}\n\nSummarize the evidence landscape.`,
              },
            ],
            temperature: 0.2,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          summary = aiData.choices?.[0]?.message?.content || summary;
        }
      } catch (error) {
        console.log("AI summary generation failed, using default:", error);
      }
    }

    const payload = { query: searchQuery, totalResults: results.length, results, summary };
    const queryId = await logQuery(admin, {
      userId,
      toolType: "literature_search",
      queryText: searchQuery,
      responseData: payload,
    });

    return jsonResponse(withQueryId(payload, queryId));
  } catch (error) {
    return handleHttpError(error, "Search failed. Please try again.");
  }
});
