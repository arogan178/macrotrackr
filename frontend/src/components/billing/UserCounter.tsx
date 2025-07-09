import React, { useState, useEffect, memo } from "react";
import { motion } from "motion/react";

interface UserCounterProps {
  className?: string;
}

const UserCounter: React.FC<UserCounterProps> = memo(({ className = "" }) => {
  const [userCount, setUserCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Simulate real user count (in production, this would come from an API)
  const targetCount = 24847;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = targetCount / steps;
    let current = 0;
    let step = 0;

    const counter = setInterval(() => {
      step++;
      current = Math.min(Math.floor(increment * step), targetCount);
      setUserCount(current);

      if (current >= targetCount) {
        clearInterval(counter);
      }
    }, duration / steps);

    return () => clearInterval(counter);
  }, [isLoaded, targetCount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`inline-flex items-center space-x-2 ${className}`}
    >
      <div className="flex items-center space-x-2 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-full px-4 py-2">
        <div className="flex -space-x-2">
          {/* Avatar stack for visual appeal */}
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full border-2 border-slate-800 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">A</span>
          </div>
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full border-2 border-slate-800 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">M</span>
          </div>
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full border-2 border-slate-800 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">S</span>
          </div>
          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full border-2 border-slate-800 flex items-center justify-center text-xs font-semibold text-white">
            +
          </div>
        </div>

        <div className="flex items-center space-x-1 text-slate-300">
          <span className="text-sm font-medium">Join</span>
          <motion.span
            key={userCount}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm font-bold text-indigo-300"
          >
            {userCount.toLocaleString()}+
          </motion.span>
          <span className="text-sm font-medium">users</span>
        </div>

        {/* Live indicator */}
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-green-400">Live</span>
        </div>
      </div>
    </motion.div>
  );
});

export default UserCounter;
