import { Shield, Search, BarChart3, FileText } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Evidence-First System",
    desc: "No hallucinated medical advice. Every response is grounded in peer-reviewed research, systematic reviews, and clinical guidelines.",
  },
  {
    icon: Search,
    title: "Direct Research Links",
    desc: "Every claim links directly to PubMed, Cochrane, and WHO sources. Verify anything in seconds.",
  },
  {
    icon: BarChart3,
    title: "Structured Evidence Grading",
    desc: "Claims are categorized as Strong, Moderate, Weak, or Unsupported — never vague confidence numbers.",
  },
  {
    icon: FileText,
    title: "Clinical Reports",
    desc: "Receive structured evidence summaries with study breakdowns, consensus mapping, and clinical interpretation.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 px-6 bg-background">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Why Evidexus
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Evidence-based intelligence designed for speed, clarity, and clinical trust.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-6 hover:border-primary/25 transition-all animate-card-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
