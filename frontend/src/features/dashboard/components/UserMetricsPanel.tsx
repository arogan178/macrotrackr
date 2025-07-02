import { memo } from "react";
import { UserIcon, StarIcon } from "@/components/Icons";
import AnimatedNumber from "@/components/animation/AnimatedNumber";

interface UserMetricsPanelProps {
  bmr: number;
  tdee: number;
  isLoading?: boolean;
}

function MetricCard({
  icon: Icon,
  title,
  acronym,
  value,
  color,
}: {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  acronym: string;
  value: number | null;
  color: "indigo" | "blue";
}) {
  const colorClasses = {
    indigo: {
      gradient: "from-indigo-600/20 to-indigo-600/5",
      border: "border-indigo-500/20",
      text: "text-indigo-400",
      acronym: "text-indigo-400/80",
    },
    blue: {
      gradient: "from-blue-600/20 to-blue-600/5",
      border: "border-blue-500/20",
      text: "text-blue-400",
      acronym: "text-blue-400/80",
    },
  };

  const classes = colorClasses[color];

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm p-3.5 rounded-2xl border border-gray-700/50 shadow-xl hover:bg-gray-800/80 transition-colors group">
      <div className="flex items-start gap-5">
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${classes.gradient} border ${classes.border}`}
        >
          <Icon
            className={`h-7 w-7 ${classes.text} transform group-hover:scale-110 transition-transform`}
            strokeWidth={1.5}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="font-medium text-gray-400 text-sm truncate">
              {title}
            </h3>
            <span className={`text-xs ${classes.acronym} whitespace-nowrap`}>
              ({acronym})
            </span>
          </div>
          <p className="text-2xl font-bold text-white">
            {value ? (
              <span className="bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
                <AnimatedNumber
                  value={value}
                  toFixedValue={0}
                  suffix=" kcal"
                  duration={0.8}
                />
              </span>
            ) : (
              <span className="text-gray-500 text-lg">Complete profile</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl animate-pulse"
        >
          <div className="flex items-start gap-5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/20">
              <div className="h-7 w-7 bg-gray-700 rounded"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-7 bg-gray-700 rounded w-2/5"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserMetricsPanel({
  bmr,
  tdee,
  isLoading = false,
}: UserMetricsPanelProps) {
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <MetricCard
        icon={UserIcon}
        title="Basal Metabolic Rate"
        acronym="BMR"
        value={bmr || null}
        color="indigo"
      />
      <MetricCard
        icon={StarIcon}
        title="Total Daily Energy"
        acronym="TDEE"
        value={tdee || null}
        color="blue"
      />
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(UserMetricsPanel);
