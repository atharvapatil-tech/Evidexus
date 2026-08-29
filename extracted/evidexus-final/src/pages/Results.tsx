import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, BookOpen, ExternalLink,
  Info, Shield, BarChart3, Users, FileText, Copy, Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { toast } from "sonner";

interface ClaimAssessment {
  claim: string;
  evidenceLevel: string;
  evidenceType: string;
  alignment: string;
  explanation: string;
  riskLevel: string;
  uncertainty: string;
  references: string[];
}

interface AnalysisResult {
  summary: { topicCategory: string; contentType: string };
  claims: string[];
  assessments: ClaimAssessment[];
  riskContext: string;
  scientificContext: string;
}

const getEvidenceBadgeClass = (level: string) => {
  const l = level.toLowerCase();
  if (l.includes("strong")) return "evidence-badge evidence-strong";
  if (l.includes("moderate")) return "evidence-badge evidence-moderate";
  if (l.includes("weak")) return "evidence-badge evidence-weak";
  if (l.includes("unsupported")) return "evidence-badge evidence-unsupported";
  if (l.includes("limited") || l.includes("animal")) return "evidence-badge evidence-limited";
  return "evidence-badge evidence-unclear";
};

const getEvidenceColor = (level: string) => {
  const l = level.toLowerCase();
  if (l.includes("strong")) return "hsl(152, 55%, 42%)";
  if (l.includes("moderate")) return "hsl(45, 85%, 55%)";
  if (l.includes("weak")) return "hsl(25, 85%, 52%)";
  if (l.includes("unsupported")) return "hsl(0, 65%, 52%)";
  return "hsl(200, 40%, 50%)";
};

const getRiskBadgeClass = (risk: string) => {
  const l = risk.toLowerCase();
  if (l.includes("low")) return "risk-badge risk-low";
  if (l.includes("medium") || l.includes("moderate")) return "risk-badge risk-medium";
  if (l.includes("high")) return "risk-badge risk-high";
  return "risk-badge risk-medium";
};

const getConsensusText = (alignment: string) => {
  const l = alignment.toLowerCase();
  if (l.includes("align") || l.includes("support") || l.includes("consistent")) return "Supported";
  if (l.includes("partial") || l.includes("mixed")) return "Mixed Evidence";
  if (l.includes("contra") || l.includes("against") || l.includes("conflict")) return "Contradicted";
  return alignment;
};

const getConsensusDots = (assessments: ClaimAssessment[]) => {
  return assessments.map((a, i) => {
    const l = a.evidenceLevel.toLowerCase();
    let position: number;
    let color: string;
    if (l.includes("strong")) { position = 10 + i * 8; color = "hsl(152, 55%, 42%)"; }
    else if (l.includes("moderate")) { position = 35 + i * 8; color = "hsl(45, 85%, 55%)"; }
    else if (l.includes("weak")) { position = 55 + i * 8; color = "hsl(25, 85%, 52%)"; }
    else { position = 75 + i * 8; color = "hsl(0, 65%, 52%)"; }
    return { position: Math.min(position, 92), color, claim: a.claim };
  });
};

const generateCitation = (claim: string, refs: string[]) => {
  const text = `Evidexus Evidence Report. Claim: "${claim}". References: ${refs.join("; ")}. Generated ${new Date().toLocaleDateString()}.`;
  navigator.clipboard.writeText(text);
  toast.success("Citation copied to clipboard");
};

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, originalContent } = (location.state as { analysis: AnalysisResult; originalContent: string }) || {};

  if (!analysis) return <Navigate to="/" replace />;

  const primaryAssessment = analysis.assessments[0];
  const consensusDots = getConsensusDots(analysis.assessments);

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-6 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 text-muted-foreground hover:text-foreground -ml-2 text-xs">
          <ArrowLeft className="mr-2 h-3.5 w-3.5" />
          Back to Search
        </Button>

        {/* Claim */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="label-text mb-2">Claim Analyzed</p>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            {analysis.summary.topicCategory || originalContent}
          </h1>
        </motion.div>

        {/* Evidence Strength Banner */}
        {primaryAssessment && (
          <motion.div
            className="rounded-xl border border-border bg-card p-6 mb-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="label-text">Evidence Strength</p>
              <div className="flex items-center gap-2">
                <span className={getEvidenceBadgeClass(primaryAssessment.evidenceLevel)}>
                  {primaryAssessment.evidenceLevel}
                </span>
                <button
                  onClick={() => toast.success("Report bookmarked")}
                  className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="Save Evidence"
                >
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{primaryAssessment.explanation}</p>
          </motion.div>
        )}

        {/* Evidence Consensus Map */}
        <motion.div
          className="rounded-xl border border-border bg-card p-6 mb-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="label-text mb-4">Evidence Consensus Map</p>
          <div className="relative h-14 rounded-lg bg-secondary overflow-hidden">
            <div className="absolute inset-0 flex">
              <div className="flex-1" style={{ background: "hsla(152, 55%, 42%, 0.08)" }} />
              <div className="flex-1" style={{ background: "hsla(45, 85%, 55%, 0.06)" }} />
              <div className="flex-1" style={{ background: "hsla(25, 85%, 52%, 0.06)" }} />
              <div className="flex-1" style={{ background: "hsla(0, 65%, 52%, 0.06)" }} />
            </div>
            {consensusDots.map((dot, i) => (
              <motion.div
                key={i}
                className="consensus-dot absolute top-1/2 -translate-y-1/2"
                style={{ left: `${dot.position}%`, backgroundColor: dot.color }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                title={dot.claim}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span>Strongly Support</span>
            <span>Moderate</span>
            <span>Weak</span>
            <span>Contradictory</span>
          </div>
        </motion.div>

        {/* Evidence Breakdown */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="text-center p-4 rounded-xl bg-card border border-border">
            <p className="text-2xl font-bold text-foreground">{analysis.assessments.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Studies</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card border border-border">
            <p className="text-2xl font-bold text-foreground">
              {analysis.assessments.filter(a => a.evidenceType?.toLowerCase().includes("rct") || a.evidenceType?.toLowerCase().includes("random")).length || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">RCTs</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card border border-border">
            <p className="text-2xl font-bold text-foreground">
              {analysis.assessments.filter(a => a.evidenceType?.toLowerCase().includes("meta") || a.evidenceType?.toLowerCase().includes("systematic")).length || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Meta/SR</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card border border-border">
            <p className="text-2xl font-bold text-foreground">
              {analysis.assessments.filter(a => a.evidenceType?.toLowerCase().includes("observ") || a.evidenceType?.toLowerCase().includes("cohort")).length || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Observational</p>
          </div>
        </motion.div>

        {/* Claim-by-claim */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Key Studies</h2>
          </div>
          <div className="space-y-3">
            {analysis.assessments.map((assessment, index) => (
              <motion.div
                key={index}
                className="rounded-xl border border-border bg-card p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.08 }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-foreground font-medium text-sm">{assessment.claim}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={getEvidenceBadgeClass(assessment.evidenceLevel)}>{assessment.evidenceLevel}</span>
                  </div>
                </div>

                <div className="ml-7 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {assessment.evidenceType && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {assessment.evidenceType}
                      </span>
                    )}
                    <span className={getRiskBadgeClass(assessment.riskLevel || "Medium")}>
                      Risk: {assessment.riskLevel || "Medium"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Consensus: {getConsensusText(assessment.alignment)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{assessment.explanation}</p>

                  {assessment.uncertainty && (
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-[10px] label-text mb-1">Limitations</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{assessment.uncertainty}</p>
                    </div>
                  )}

                  {assessment.references?.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {assessment.references.map((ref, ri) => (
                        <span key={ri} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                          <ExternalLink className="h-2.5 w-2.5" />{ref}
                        </span>
                      ))}
                      <button
                        onClick={() => generateCitation(assessment.claim, assessment.references)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-xs text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Copy className="h-2.5 w-2.5" /> Cite
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Clinical Interpretation */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Clinical Interpretation</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{analysis.scientificContext}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-accent" />
              <h3 className="font-semibold text-foreground text-sm">Risk Context</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{analysis.riskContext}</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-lg bg-secondary border border-border mb-6">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground/70">Disclaimer:</strong> This report is for informational purposes only and does not constitute medical advice. Evidence assessments are based on current scientific literature. Always consult qualified healthcare professionals for medical decisions.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button onClick={() => navigate("/")} variant="outline" className="text-xs">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            New Search
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Results;
