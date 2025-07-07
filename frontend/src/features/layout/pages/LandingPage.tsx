import React from "react";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import PricingSection from "../components/PricingSection";
import TestimonialsSection from "../components/TestimonialsSection";
import FinalCTASection from "../components/FinalCTASection";
import Footer from "../components/Footer";
import BackgroundAnimation from "@/components/animation/BackgroundAnimation";

const LandingPage: React.FC = () => {
  React.useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden scroll-smooth">
      <BackgroundAnimation />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/30"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(67,56,202,0.2),transparent_50%)]"></div>
      </div>

      <Header />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
