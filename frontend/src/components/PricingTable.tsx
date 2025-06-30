import React from "react";
import { ProBadge } from "@/components/ProBadge";

interface PricingTableProps {
  onUpgrade?: () => void;
}

/**
 * PricingTable - Shows Free vs. Pro features
 * Usage: <PricingTable onUpgrade={...} />
 */
export const PricingTable: React.FC<PricingTableProps> = ({ onUpgrade }) => (
  <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold mb-4 text-center">Compare Plans</h2>
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="text-left p-2">Feature</th>
          <th className="p-2">Free</th>
          <th className="p-2">
            Pro <ProBadge />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="p-2">Macro Tracking</td>
          <td className="text-center">✔️</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Meal Types</td>
          <td className="text-center">✔️</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Dashboard</td>
          <td className="text-center">✔️</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Weight Logging</td>
          <td className="text-center">✔️</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Basic Goal Setting</td>
          <td className="text-center">✔️</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Standard Reporting</td>
          <td className="text-center">✔️</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Advanced Reporting & Analytics</td>
          <td className="text-center text-gray-400">—</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Advanced Goal Setting</td>
          <td className="text-center text-gray-400">—</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Full Habit Tracking</td>
          <td className="text-center text-gray-400">—</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Recipe & Meal Saver</td>
          <td className="text-center text-gray-400">—</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Customization (Themes, Icons)</td>
          <td className="text-center text-gray-400">—</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Ad-Free Experience</td>
          <td className="text-center text-gray-400">—</td>
          <td className="text-center">✔️</td>
        </tr>
        <tr>
          <td className="p-2">Priority Support</td>
          <td className="text-center text-gray-400">—</td>
          <td className="text-center">✔️</td>
        </tr>
      </tbody>
    </table>
    <div className="mt-6 flex flex-col items-center">
      <button
        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded text-lg shadow focus:outline-none focus:ring-2 focus:ring-yellow-300"
        onClick={onUpgrade}
        aria-label="Upgrade to Pro"
      >
        Get Started with Pro
      </button>
      <span className="text-xs text-gray-500 mt-2">
        $5/month • Cancel anytime
      </span>
    </div>
  </div>
);

// Usage example:
// <PricingTable onUpgrade={() => ...} />
