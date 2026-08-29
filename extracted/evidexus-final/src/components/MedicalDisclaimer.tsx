interface MedicalDisclaimerProps {
  compact?: boolean;
}

const MedicalDisclaimer = ({ compact = false }: MedicalDisclaimerProps) => {
  if (compact) {
    return (
      <p className="text-[11px] text-muted-foreground text-center">
        For clinical decision support only. Not a substitute for professional medical judgment.
      </p>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        <span className="font-semibold">Disclaimer.</span> Evidexus provides
        evidence-based clinical decision support. All outputs should be verified by
        qualified healthcare professionals. This tool does not replace clinical judgment.
      </p>
    </div>
  );
};

export { MedicalDisclaimer };
export default MedicalDisclaimer;
