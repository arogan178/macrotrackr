import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-foreground mb-4">Oops! Page not found</p>
        <a href="/" className="text-primary hover:text-primary underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
