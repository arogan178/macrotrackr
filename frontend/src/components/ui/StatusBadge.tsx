import React from "react";

import { CheckCircleIcon, InfoIcon, WarningIcon } from "@/components/ui";

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusInfo = {
    active: {
      text: "Active",
      className: "bg-success/20 text-success border border-green-500/40",
      icon: <CheckCircleIcon className="mr-1.5 h-3 w-3" />,
    },
    past_due: {
      text: "Past Due",
      className: "bg-warning/20 text-warning border border-yellow-500/40",
      icon: <WarningIcon className="mr-1.5 h-3 w-3" />,
    },
    unpaid: {
      text: "Unpaid",
      className: "bg-vibrant-accent/20 text-error border border-red-500/40",
      icon: <WarningIcon className="mr-1.5 h-3 w-3" />,
    },
    canceled: {
      text: "Canceled",
      className: "bg-surface/20 text-foreground border border-border/40",
      icon: <InfoIcon className="mr-1.5 h-3 w-3" />,
    },
  }[status];

  if (!statusInfo) {
    return (
      <div className="inline-flex items-center rounded-full border border-border/40 bg-surface/20 px-2.5 py-1 text-xs font-semibold text-foreground capitalize">
        {status}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${statusInfo.className}`}
    >
      {statusInfo.icon}
      {statusInfo.text}
    </div>
  );
};

export default StatusBadge;
