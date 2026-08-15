import Panel from "@/components/ui/Panel";
import Skeleton from "@/components/ui/Skeleton";

export default function SettingsLoadingSkeleton() {
  return (
    <Panel>
      <div className="mb-8 flex items-center gap-4">
        <Skeleton className="h-12 w-12" rounded="full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11" />
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Skeleton className="h-11 w-32" rounded="full" />
      </div>
    </Panel>
  );
}
