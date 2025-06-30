import React from "react";
import { PricingTable } from "@/components/PricingTable";
import { createCheckoutSession } from "@/utils/api-billing";

/**
 * /pricing page - Feature comparison and upgrade flow
 */
const PricingPage: React.FC = () => {
  const handleUpgrade = async () => {
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (e) {
      alert("Failed to start checkout. Please try again.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12">
      <PricingTable onUpgrade={handleUpgrade} />
    </main>
  );
};

export default PricingPage;

// Usage: Add route /pricing -> <PricingPage />
