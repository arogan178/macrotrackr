import { CircleHelp, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

/**
 * TrustIndicators renders the trust and assurance section for the pricing area.
 * Usage example:
 *   <TrustIndicators />
 */
const indicators = [
  {
    icon: <ShieldCheck className="h-6 w-6 text-success" />,
    bg: "bg-success/20",
    hoverBg: "hover:bg-success/30",
    title: "Secure & Private",
    desc: "Your data is encrypted and protected",
    hoverTitle: "group-hover:text-success",
    hoverDesc: "group-hover:text-foreground",
  },
  {
    icon: <CircleHelp className="h-6 w-6 text-primary" />,
    bg: "bg-primary/20",
    hoverBg: "hover:bg-primary/30",
    title: "24/7 Support",
    desc: "Get help whenever you need it",
    hoverTitle: "group-hover:text-primary",
    hoverDesc: "group-hover:text-foreground",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-secondary" />,
    bg: "bg-secondary/20",
    hoverBg: "hover:bg-secondary/30",
    title: "Always Improving",
    desc: "Regular updates and new features",
    hoverTitle: "group-hover:text-secondary",
    hoverDesc: "group-hover:text-foreground",
  },
];

const TrustIndicators: React.FC = () => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          staggerChildren: 0.18,
          type: "spring" as const,
          stiffness: 400,
          damping: 30,
        },
      },
    }}
    className="mt-16 text-center"
  >
    <motion.div className="grid grid-cols-1 gap-8 md:grid-cols-3" variants={{}}>
      {indicators.map((item) => (
        <motion.div
          key={item.title}
          className="group flex flex-col items-center"
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: "spring" as const,
                stiffness: 400,
                damping: 30,
              },
            },
          }}
          whileHover={{ scale: 1.03, y: -3 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        >
          <div
            className={`h-12 w-12 ${item.bg} ${item.hoverBg} mb-3 flex items-center justify-center rounded-full transition-colors duration-200`}
          >
            {item.icon}
          </div>
          <h4
            className={`mb-1 font-semibold text-foreground transition-colors duration-200 ${item.hoverTitle}`}
          >
            {item.title}
          </h4>
          <p
            className={`text-sm text-foreground transition-colors duration-200 ${item.hoverDesc}`}
          >
            {item.desc}
          </p>
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);

export default TrustIndicators;
