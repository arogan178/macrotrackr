import React from "react";

import { CheckCircleIcon, InfoIcon, WarningIcon } from "@/components/ui";

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusInfo = {
    active: {
      text: "Active",
      className: "bg-green-500/20 text-green-300 border border-green-500/40",
      icon: <CheckCircleIcon className="w-3 h-3 mr-1.5" />,
    },
    past_due: {
      text: "Past Due",
      className: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
      icon: <WarningIcon className="w-3 h-3 mr-1.5" />,
    },
    unpaid: {
      text: "Unpaid",
      className: "bg-red-500/20 text-red-300 border border-red-500/40",
      icon: <WarningIcon className="w-3 h-3 mr-1.5" />,
    },
    canceled: {
      text: "Canceled",
      className: "bg-gray-500/20 text-gray-300 border border-gray-500/40",
      icon: <InfoIcon className="w-3 h-3 mr-1.5" />,
    },
  }[status];

  if (!statusInfo) {
    return (
      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300 border border-gray-500/40 capitalize">
        {status}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.className}`}
    >
      {statusInfo.icon}
      {statusInfo.text}
    </div>
  );
};

export default StatusBadge;
