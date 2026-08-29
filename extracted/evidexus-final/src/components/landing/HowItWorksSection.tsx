import { Search, FileText, BarChart3, ClipboardList } from "lucide-react";

const steps = [
  { icon: Search, step: "01", title: "Query", description: "You ask a medical evidence question. The system extracts the core claim." },
  { icon: FileText, step: "02", title: "Retrieve", description: "Evidence is retrieved from PubMed, systematic reviews, and clinical guidelines." },
  { icon: BarChart3, step: "03", title: "Evaluate", description: "Studies are scored by type, quality, and relevance using evidence hierarchies." },
  { icon: ClipboardList, step: "04", title: "Report", description: "A structured evidence summary is generated with consensus mapping and source links." },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 px-6 bg-card/50">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            How It Works
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            From question to evidence report in seconds.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-xs font-mono text-primary/60 mb-3">{s.step}</div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-2">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
