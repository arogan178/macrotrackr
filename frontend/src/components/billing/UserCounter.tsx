import { motion } from "motion/react";
import PropTypes from "prop-types";
import React, { memo, useEffect, useState } from "react";

interface UserCounterProps {
  className?: string;
}

const UserCounter: React.FC<UserCounterProps> = memo(function UserCounter({
  className = "",
}) {
  const [userCount, setUserCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Simulate real user count (in production, this would come from an API)
  const targetCount = 24_847;

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
      <div className="flex items-center space-x-2 bg-surface/60 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2">
        <div className="flex -space-x-2">
          {/* Avatar stack for visual appeal */}
          <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary rounded-full border-2 border-border flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">A</span>
          </div>
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-primary rounded-full border-2 border-border flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">M</span>
          </div>
          <div className="w-6 h-6 bg-gradient-to-br from-primary to-cyan-600 rounded-full border-2 border-border flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">S</span>
          </div>
          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full border-2 border-border flex items-center justify-center text-xs font-semibold text-foreground">
            +
          </div>
        </div>

        <div className="flex items-center space-x-1 text-foreground">
          <span className="text-sm font-medium">Join</span>
          <motion.span
            key={userCount}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm font-bold text-primary"
          >
            {userCount.toLocaleString()}+
          </motion.span>
          <span className="text-sm font-medium">users</span>
        </div>

        {/* Live indicator */}
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-success">Live</span>
        </div>
      </div>
    </motion.div>
  );
});
UserCounter.displayName = "UserCounter";
UserCounter.propTypes = {
  className: PropTypes.string,
};

export default UserCounter;
