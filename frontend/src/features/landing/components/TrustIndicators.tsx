import { CircleHelp, ShieldCheck, Sparkles } from "lucide-react";
import React from "react";

const indicators = [
  {
    icon: <ShieldCheck className="h-6 w-6 text-success" aria-hidden="true" />,
    bg: "bg-success/10 border border-success/20",
    title: "Secure by Default",
    desc: "Your account and nutrition data stay protected.",
  },
  {
    icon: <CircleHelp className="h-6 w-6 text-primary" aria-hidden="true" />,
    bg: "bg-primary/10 border border-primary/20",
    title: "Helpful Support",
    desc: "Get clear answers when you need them.",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />,
    bg: "bg-primary/10 border border-primary/20",
    title: "Actively Improved",
    desc: "We ship practical updates based on real feedback.",
  },
];

const TrustIndicators: React.FC = () => (
  <div className="mt-16 text-center">
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {indicators.map((item) => (
        <div key={item.title} className="flex flex-col items-center">
          <div
            className={`h-12 w-12 ${item.bg} mb-4 flex items-center justify-center rounded-full`}
          >
            {item.icon}
          </div>
          <h4 className="mb-1 font-semibold tracking-tight text-foreground">
            {item.title}
          </h4>
          <p className="text-sm tracking-tight text-balance text-muted">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default TrustIndicators;
