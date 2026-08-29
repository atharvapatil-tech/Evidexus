import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Free", price: "$0", period: "forever",
    description: "For exploring the platform",
    features: ["5 evidence queries per day", "Basic literature search", "Standard response time", "Community support"],
    cta: "Get Started", featured: false
  },
  {
    name: "Pro", price: "$49", period: "per month",
    description: "For practicing physicians",
    features: ["Unlimited queries", "Advanced literature search", "Treatment comparison", "Priority processing", "Export reports (PDF)", "Study type filters", "Citation generation"],
    cta: "Start Free Trial", featured: true
  },
  {
    name: "Enterprise", price: "Custom", period: "per org",
    description: "For healthcare organizations",
    features: ["Unlimited seats", "Custom guideline sources", "EHR integration ready", "Dedicated account manager", "SLA guarantee", "HIPAA compliance", "API access"],
    cta: "Contact Sales", featured: false
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 px-6 bg-card/50">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Simple Pricing
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Choose the plan that fits your clinical practice.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <div key={i} className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
              {plan.featured && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center mb-5">
                <h3 className="font-semibold text-foreground text-base mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-xs">/{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <span className="text-xs text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate("/auth")}
                className={`w-full h-10 font-medium text-sm rounded-lg ${
                  plan.featured ? 'btn-premium text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
