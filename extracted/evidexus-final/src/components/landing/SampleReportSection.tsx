import { motion } from "framer-motion";
import { BookOpen, ExternalLink } from "lucide-react";

const sampleStudies = [
  { title: "Curcumin and Cancer: Barriers to Obtaining a Health Claim", year: "2022", journal: "Nutrients", type: "Systematic Review" },
  { title: "Therapeutic Potential of Curcumin in Breast Cancer", year: "2023", journal: "Cancers", type: "Meta-Analysis" },
  { title: "Phase IIa Clinical Trial of Curcumin", year: "2021", journal: "Clin Cancer Res", type: "RCT" },
];

const consensusDots = [
  { position: 15, color: "hsl(152, 55%, 42%)", label: "Support" },
  { position: 25, color: "hsl(152, 55%, 42%)", label: "Support" },
  { position: 30, color: "hsl(152, 55%, 42%)", label: "Support" },
  { position: 45, color: "hsl(45, 85%, 55%)", label: "Neutral" },
  { position: 55, color: "hsl(45, 85%, 55%)", label: "Neutral" },
  { position: 70, color: "hsl(25, 85%, 52%)", label: "Weak" },
  { position: 80, color: "hsl(0, 65%, 52%)", label: "Contradictory" },
];

const SampleReportSection = () => {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Sample Evidence Report
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            See how Evidexus structures medical evidence into actionable clinical intelligence.
          </p>
        </div>

        <motion.div
          className="rounded-xl border border-border bg-card overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <p className="label-text mb-2">Claim Analyzed</p>
            <p className="text-foreground font-medium text-lg">"Does turmeric cure cancer?"</p>
          </div>

          {/* Evidence Strength */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <p className="label-text">Evidence Strength</p>
              <span className="evidence-badge evidence-weak">Weak</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Current evidence suggests turmeric compounds show anti-cancer activity in laboratory studies, but clinical trials in humans remain limited. No high-quality RCTs support turmeric as a standalone cancer treatment.
            </p>
          </div>

          {/* Consensus Map */}
          <div className="p-6 border-b border-border">
            <p className="label-text mb-4">Evidence Consensus Map</p>
            <div className="relative h-16 rounded-lg bg-secondary overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-evidence-strong/10" />
                <div className="flex-1 bg-evidence-moderate/10" />
                <div className="flex-1 bg-evidence-weak/10" />
                <div className="flex-1 bg-evidence-unsupported/10" />
              </div>
              {/* Dots */}
              {consensusDots.map((dot, i) => (
                <motion.div
                  key={i}
                  className="consensus-dot absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${dot.position}%`, backgroundColor: dot.color }}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  title={dot.label}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
              <span>Strongly Support</span>
              <span>Neutral</span>
              <span>Contradictory</span>
            </div>
          </div>

          {/* Key Studies */}
          <div className="p-6 border-b border-border">
            <p className="label-text mb-4">Key Studies</p>
            <div className="space-y-3">
              {sampleStudies.map((study, i) => (
                <div key={i} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-foreground font-medium">{study.title}</p>
                      <p className="text-xs text-muted-foreground">{study.journal} · {study.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">{study.type}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Breakdown */}
          <div className="p-6 border-b border-border">
            <p className="label-text mb-3">Evidence Breakdown</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xl font-bold text-foreground">12</p>
                <p className="text-[10px] text-muted-foreground">Total Studies</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xl font-bold text-foreground">2</p>
                <p className="text-[10px] text-muted-foreground">RCTs</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xl font-bold text-foreground">5</p>
                <p className="text-[10px] text-muted-foreground">Observational</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xl font-bold text-foreground">5</p>
                <p className="text-[10px] text-muted-foreground">Preclinical</p>
              </div>
            </div>
          </div>

          {/* Clinical Interpretation */}
          <div className="p-6">
            <p className="label-text mb-2">Clinical Interpretation</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Evidence does not support turmeric as a standalone cancer treatment. Preclinical studies show activity, but human trials are limited by small sample sizes, heterogeneous populations, and methodological bias. Clinicians should note the gap between in-vitro results and clinical applicability.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SampleReportSection;
