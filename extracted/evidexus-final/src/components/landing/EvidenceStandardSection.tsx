import { BookOpen, FlaskConical, ShieldCheck, Users } from "lucide-react";

const standards = [
  { icon: BookOpen, text: "Evidence graded using Level I-V hierarchy (systematic reviews → expert opinion)" },
  { icon: FlaskConical, text: "References specific RCTs, meta-analyses, and clinical guidelines" },
  { icon: ShieldCheck, text: "No diagnostic conclusions — supports clinical reasoning, not replaces it" },
  { icon: Users, text: "Designed for verified physicians and healthcare professionals" },
];

const EvidenceStandardSection = () => {
  return (
    <section className="py-16 px-6 bg-background border-y border-border">
      <div className="container max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
            Clinical Evidence Standard
          </h2>
          <p className="text-muted-foreground text-sm">
            How Evidexus ensures clinical-grade accuracy
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {standards.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EvidenceStandardSection;
