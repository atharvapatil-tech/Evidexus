import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, enforceUsageLimit, handleHttpError, jsonResponse, logQuery, parseJsonBody, requireAuth, requireString, withQueryId } from "../_shared/security.ts";

async function searchPubMed(query: string, max = 8) {
  try {
    const searchRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${max}&sort=relevance&retmode=json&mindate=2010&datetype=pdat`);
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const pmids: string[] = searchData.esearchresult?.idlist ?? [];
    if (!pmids.length) return [];
    const [summaryRes, fetchRes] = await Promise.all([
      fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=json`),
      fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(",")}&rettype=abstract&retmode=xml`),
    ]);
    const summaryData = summaryRes.ok ? await summaryRes.json() : {};
    const xml = fetchRes.ok ? await fetchRes.text() : "";
    return pmids.map((pmid) => {
      const s = summaryData.result?.[pmid];
      if (!s) return null;
      const pmidIdx = xml.indexOf(`<PMID Version="1">${pmid}</PMID>`);
      let abstract = "";
      if (pmidIdx !== -1) {
        const next = xml.indexOf('<PMID Version="1">', pmidIdx + 10);
        const chunk = xml.slice(pmidIdx, next > 0 ? next : pmidIdx + 8000);
        const m = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/i.exec(chunk);
        if (m) abstract = m[1].replace(/<[^>]*>/g, "").trim().slice(0, 600);
      }
      const authors = (s.authors ?? []).slice(0, 3).map((a: { name: string }) => a.name).join(", ");
      return { pmid, title: s.title ?? "Untitled", authors: (s.authors?.length ?? 0) > 3 ? authors + " et al." : authors || "Unknown", journal: s.fulljournalname ?? s.source ?? "Unknown Journal", year: parseInt(s.pubdate ?? "") || new Date().getFullYear(), abstract: abstract || "Abstract not available.", pubTypes: s.pubtype ?? [] };
    }).filter(Boolean);
  } catch (err) { console.error("PubMed error:", err); return []; }
}

function grade(pubTypes: string[], title: string, abstract: string) {
  const t = pubTypes.map((s: string) => s.toLowerCase()); const ti = title.toLowerCase(); const ab = abstract.toLowerCase();
  if (t.some((x: string) => x.includes("meta-analysis"))) return { level: "I", label: "Meta-Analysis" };
  if (t.some((x: string) => x.includes("systematic review")) || ti.includes("systematic review")) return { level: "I", label: "Systematic Review" };
  if (t.some((x: string) => x.includes("randomized controlled")) || ab.includes("randomized controlled trial")) return { level: "II", label: "RCT" };
  if (t.some((x: string) => x.includes("guideline")) || ti.includes("guideline")) return { level: "II", label: "Clinical Guideline" };
  if (t.some((x: string) => x.includes("clinical trial")) || ab.includes("prospective")) return { level: "III", label: "Clinical Trial" };
  if (t.some((x: string) => x.includes("case report"))) return { level: "IV", label: "Case Report" };
  return { level: "V", label: "Review" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { admin, userId } = await requireAuth(req);
    await enforceUsageLimit(admin, userId);
    const body = await parseJsonBody<{ query?: unknown }>(req, 4_000);
    const searchQuery = requireString(body.query, "Query", 3, 500);
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const articles = await searchPubMed(searchQuery, 8);
    const results = articles.map((a: any) => { const { level, label } = grade(a.pubTypes, a.title, a.abstract); return { pmid: a.pmid, title: a.title, authors: a.authors, journal: a.journal, year: a.year, type: label, evidenceLevel: level, abstract: a.abstract, url: `https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/` }; }).sort((a: any, b: any) => { const o: Record<string,number> = { I:1,II:2,III:3,IV:4,V:5 }; return (o[a.evidenceLevel]||5)-(o[b.evidenceLevel]||5)||b.year-a.year; });
    let summary = `Found ${results.length} PubMed articles for "${searchQuery}".`;
    if (geminiKey && results.length > 0) {
      try {
        const studyList = results.slice(0, 5).map((r: any) => `- ${r.title} (${r.type}, ${r.year})`).join("\n");
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `Summarize evidence for "${searchQuery}" in 2-3 sentences:\n${studyList}` }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 200 } }) });
        if (aiRes.ok) { const aiData = await aiRes.json(); const t = aiData.candidates?.[0]?.content?.parts?.[0]?.text; if (t) summary = t; }
      } catch (e) { console.error("Summary failed:", e); }
    }
    const payload = { query: searchQuery, total: results.length, results, summary };
    const qid = await logQuery(admin, { userId, toolType: "literature_search", queryText: searchQuery, responseData: payload });
    return jsonResponse(withQueryId(payload, qid));
  } catch (err) { return handleHttpError(err, "Literature search error"); }
});
