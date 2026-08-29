import { AlertCircle } from "lucide-react";

const Disclaimer = () => {
  return (
    <div className="border-t border-border bg-muted/50 py-6 px-6">
      <div className="container max-w-5xl mx-auto">
        <div className="flex items-start gap-3 mb-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <h3 className="font-serif font-semibold text-foreground">Important Notice</h3>
        </div>
        <div className="pl-8 space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Evidexus is an evidence validation and risk context platform for informational purposes only. 
            It does <strong>not</strong> provide medical advice, diagnosis, or treatment recommendations.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The information provided by this platform evaluates scientific credibility, uncertainty, and potential 
            risk of health claims. Users must consult qualified healthcare professionals for any medical decisions.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This tool does not replace professional medical consultation and should not be used as a substitute 
            for advice from licensed healthcare providers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
