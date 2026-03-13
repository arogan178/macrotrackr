import type { ReactNode } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/classnameUtilities";

interface AnalyticsToolbarProps {
  children: ReactNode;
  className?: string;
}

export default function AnalyticsToolbar({
  children,
  className,
}: AnalyticsToolbarProps) {
  return (
    <motion.div
      layout
      className={cn(
        "sticky top-24 z-50 mb-6 rounded-xl border border-border/70 bg-surface/92 p-3 shadow-lg backdrop-blur-md",
        className,
      )}
      style={{ position: "sticky" }}
    >
      {children}
    </motion.div>
  );
}
