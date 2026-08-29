import { forwardRef } from "react";
import logo from "@/assets/logo.webp";

const FooterSection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="py-12 px-6 bg-card border-t border-border">
      <div className="container max-w-4xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt="Evidexus" className="h-7 w-7 object-contain" />
              <span className="text-base font-semibold text-foreground">Evidexus</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-3">
              Evidence-based clinical intelligence for healthcare professionals. Structured evidence from PubMed, Cochrane, WHO, and 50+ guideline sources.
            </p>
            <p className="text-muted-foreground/50 text-xs">© {new Date().getFullYear()} Evidexus. All rights reserved.</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-foreground mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Clinical Q&A</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Literature Search</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Treatment Comparison</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm text-foreground mb-3">Company</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-5">
          <div className="bg-secondary rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground/70">Clinical Disclaimer:</strong> Evidexus is a clinical decision support tool and does not replace professional medical judgment. All information is for clinical reference only.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

FooterSection.displayName = "FooterSection";

export default FooterSection;
