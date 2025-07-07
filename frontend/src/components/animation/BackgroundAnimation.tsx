import React from "react";
import { motion, useReducedMotion } from "motion/react";

const blobs = [
  {
    style:
      "top-[-100px] left-[-100px] w-[400px] h-[400px] bg-gradient-to-br from-indigo-500/30 to-purple-500/20",
    animate: { x: [0, 40, 0], y: [0, 30, 0] },
    duration: 12,
    delay: 0,
  },
  {
    style:
      "bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-gradient-to-tr from-blue-400/20 to-indigo-400/10",
    animate: { x: [0, -30, 0], y: [0, -40, 0] },
    duration: 16,
    delay: 2,
  },
  {
    style:
      "top-[30%] left-[60%] w-[300px] h-[300px] bg-gradient-to-br from-purple-400/20 to-indigo-400/10",
    animate: { x: [0, 20, 0], y: [0, 20, 0] },
    duration: 18,
    delay: 1,
  },
];

const BackgroundAnimation: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${blob.style}`}
          animate={prefersReducedMotion ? {} : blob.animate}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            delay: blob.delay,
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundAnimation;
