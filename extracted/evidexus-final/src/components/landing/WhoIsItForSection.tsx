import { Stethoscope, GraduationCap, FlaskConical, Newspaper, Building2 } from "lucide-react";

const audiences = [
  { icon: Stethoscope, title: "Physicians & Clinicians", description: "Point-of-care evidence lookup with structured clinical reasoning." },
  { icon: GraduationCap, title: "Medical Residents", description: "Evidence-based learning with literature access and study grading." },
  { icon: FlaskConical, title: "Clinical Researchers", description: "Rapid literature review, evidence synthesis, and treatment comparison." },
  { icon: Newspaper, title: "Medical Journalists", description: "Fact-check health claims against scientific evidence." },
  { icon: Building2, title: "Healthcare Organizations", description: "Enterprise clinical intelligence for protocol development." },
];

const WhoIsItForSection = () => {
  return (
    <section className="py-24 px-6 bg-card/50">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Built for Healthcare Professionals
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Designed for clinicians, researchers, and institutions who need reliable evidence.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {audiences.map((a, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 text-center hover:border-primary/20 transition-colors">
              <div className="h-11 w-11 rounded-xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                <a.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1.5">{a.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoIsItForSection;
