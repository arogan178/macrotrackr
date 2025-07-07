import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CircleHelp, Sparkles } from "lucide-react";

/**
 * TrustIndicators renders the trust and assurance section for the pricing area.
 * Usage example:
 *   <TrustIndicators />
 */
const indicators = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
    bg: "bg-green-500/20",
    hoverBg: "rgba(34, 197, 94, 0.3)",
    title: "Secure & Private",
    desc: "Your data is encrypted and protected",
    hoverTitle: "text-green-100",
    hoverDesc: "text-slate-300",
  },
  {
    icon: <CircleHelp className="w-6 h-6 text-blue-400" />,
    bg: "bg-blue-500/20",
    hoverBg: "rgba(59, 130, 246, 0.3)",
    title: "24/7 Support",
    desc: "Get help whenever you need it",
    hoverTitle: "text-blue-100",
    hoverDesc: "text-slate-300",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-purple-400" />,
    bg: "bg-purple-500/20",
    hoverBg: "rgba(147, 51, 234, 0.3)",
    title: "Always Improving",
    desc: "Regular updates and new features",
    hoverTitle: "text-purple-100",
    hoverDesc: "text-slate-300",
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
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-8"
      variants={{}}
    >
      {indicators.map((item) => (
        <motion.div
          key={item.title}
          className="flex flex-col items-center group"
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
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <motion.div
            className={`w-12 h-12 ${item.bg} rounded-full flex items-center justify-center mb-3`}
            whileHover={{
              scale: 1.1,
              backgroundColor: item.hoverBg,
            }}
            transition={{ duration: 0.2 }}
          >
            {item.icon}
          </motion.div>
          <h4
            className={`font-semibold text-white mb-1 group-hover:${item.hoverTitle} transition-colors duration-200`}
          >
            {item.title}
          </h4>
          <p
            className={`text-slate-400 text-sm group-hover:${item.hoverDesc} transition-colors duration-200`}
          >
            {item.desc}
          </p>
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);

export default TrustIndicators;
