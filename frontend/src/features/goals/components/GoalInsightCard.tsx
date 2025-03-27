import { InfoIcon } from "@/components/Icons";

interface GoalInsightCardProps {
  message: string;
  type?: "info" | "success" | "warning";
}

export default function GoalInsightCard({
  message,
  type = "info",
}: GoalInsightCardProps) {
  const getColorClasses = () => {
    switch (type) {
      case "success":
        return "bg-green-600/10 border-green-500/30 text-green-300";
      case "warning":
        return "bg-yellow-600/10 border-yellow-500/30 text-yellow-300";
      default:
        return "bg-indigo-600/10 border-indigo-500/30 text-indigo-300";
    }
  };

  return (
    <div
      className={`mt-6 p-4 rounded-xl border ${getColorClasses()} flex gap-3`}
    >
      <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
