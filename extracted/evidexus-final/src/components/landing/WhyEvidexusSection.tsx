import { Shield, Eye, BookOpen, Lock, Scale, Activity } from "lucide-react";

const principles = [
  { icon: Scale, title: "Evidence-Based, Not Opinion-Based", description: "All responses grounded in peer-reviewed research, systematic reviews, and clinical guidelines." },
  { icon: Shield, title: "Clinical-Grade Accuracy", description: "Strict clinical reasoning constraints with evidence hierarchies (Level I-V)." },
  { icon: Activity, title: "Real-Time Evidence", description: "Access to current guidelines from AHA, ACC, IDSA, NCCN, WHO, and 50+ sources." },
  { icon: Eye, title: "Transparent Limitations", description: "Every response includes evidence levels, uncertainty notes, and areas of controversy." },
  { icon: BookOpen, title: "Literature-Backed", description: "References specific trials, systematic reviews, and guidelines — not generic summaries." },
  { icon: Lock, title: "HIPAA-Ready Architecture", description: "No patient data storage. Secure processing designed for clinical environments." },
];

const WhyEvidexusSection = () => {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Built on Scientific Integrity
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Clinical AI that physicians can trust — evidence-based methodology, transparent limitations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {principles.map((p, i) => (
            <div key={i} className="section-card">
              <div className="feature-icon mb-4">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-2">{p.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyEvidexusSection;
