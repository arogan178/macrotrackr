import { Link } from "@tanstack/react-router";
import { MoveLeft } from "lucide-react";

import Button from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold tracking-tighter text-foreground mb-4">
        404
      </h1>
      <h2 className="text-2xl font-medium text-foreground mb-6">
        Page not found
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Sorry, we couldn't find the page you're looking for. The page might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/">
        <Button size="lg" className="flex items-center gap-2">
          <MoveLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}

export default NotFoundPage;
