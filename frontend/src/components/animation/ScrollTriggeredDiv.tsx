import { motion, useInView } from "motion/react";
import React, { useRef } from "react";

interface ScrollTriggeredDivProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const ScrollTriggeredDiv: React.FC<ScrollTriggeredDivProps> = ({
  children,
  className = "",
  delay = 0,
}) => {
  const reference = useRef(undefined);
  const isInView = useInView(reference, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={reference}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 32,
        duration: 0.65,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollTriggeredDiv;
