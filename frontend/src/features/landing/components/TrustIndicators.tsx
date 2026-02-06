import { CircleHelp, ShieldCheck, Sparkles } from "lucide-react";
import React from "react";

const indicators = [
  {
    icon: <ShieldCheck className="h-6 w-6 text-success" />,
    bg: "bg-success/15",
    title: "Secure & Private",
    desc: "Your data is encrypted and protected",
  },
  {
    icon: <CircleHelp className="h-6 w-6 text-primary" />,
    bg: "bg-primary/15",
    title: "24/7 Support",
    desc: "Get help whenever you need it",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-secondary" />,
    bg: "bg-secondary/15",
    title: "Always Improving",
    desc: "Regular updates and new features",
  },
];

const TrustIndicators: React.FC = () => (
  <div className="mt-16 text-center">
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {indicators.map((item) => (
        <div key={item.title} className="flex flex-col items-center">
          <div
            className={`h-12 w-12 ${item.bg} mb-3 flex items-center justify-center rounded-full`}
          >
            {item.icon}
          </div>
          <h4 className="mb-1 font-semibold text-foreground">{item.title}</h4>
          <p className="text-sm text-muted">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default TrustIndicators;
