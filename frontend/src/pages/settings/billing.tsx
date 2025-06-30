import React from "react";
import { createPortalSession } from "@/utils/api-billing";

/**
 * /settings/billing page - Pro users manage subscription
 */
const BillingPage: React.FC = () => {
  const handleManage = async () => {
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (e) {
      alert("Failed to open billing portal. Please try again.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12">
      <div className="bg-white rounded-lg shadow p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Manage Subscription</h2>
        <p className="mb-4">
          You are a <span className="font-semibold">Pro</span> member. Manage
          your subscription, payment methods, or cancel anytime.
        </p>
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded text-lg shadow focus:outline-none focus:ring-2 focus:ring-yellow-300 w-full"
          onClick={handleManage}
        >
          Manage Subscription
        </button>
      </div>
    </main>
  );
};

export default BillingPage;

// Usage: Add route /settings/billing -> <BillingPage />
