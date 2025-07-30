import React, { Suspense } from "react";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import PageBackground from "../components/PageBackground";

const FeaturesSection = React.lazy(
  () => import("../components/FeaturesSection"),
);
const PricingSection = React.lazy(() => import("../components/PricingSection"));
const TestimonialsSection = React.lazy(
  () => import("../components/TestimonialsSection"),
);
const FinalCtaSection = React.lazy(
  () => import("../components/FinalCtaSection"),
);

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface relative overflow-hidden scroll-smooth">
      <PageBackground />
      <Header />
      <HeroSection />
      <Suspense fallback={<LoadingSpinner />}>
        <FeaturesSection />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <PricingSection />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <TestimonialsSection />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <FinalCtaSection />
      </Suspense>
      <Footer />
    </div>
  );
};

export default LandingPage;
