import Layout from "@/components/Layout";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SampleReportSection from "@/components/landing/SampleReportSection";
import WhyEvidexusSection from "@/components/landing/WhyEvidexusSection";
import WhoIsItForSection from "@/components/landing/WhoIsItForSection";
import EvidenceStandardSection from "@/components/landing/EvidenceStandardSection";
import PricingSection from "@/components/landing/PricingSection";
import FooterSection from "@/components/landing/FooterSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SampleReportSection />
      <WhyEvidexusSection />
      <WhoIsItForSection />
      <EvidenceStandardSection />
      <PricingSection />
      <FooterSection />
    </Layout>
  );
};

export default Index;
