import { useEffect, useState } from "react";

import { Button, CheckIcon, ShareIcon } from "@/components/ui";
import { useProductAnalytics } from "@/lib/productAnalytics";

interface ShareResultButtonProps {
  url: string;
  title: string;
  calculator: string;
}

/**
 * Shares a link that reopens the calculator with the same inputs. The system
 * share sheet where there is one, otherwise a copy to the clipboard.
 */
export default function ShareResultButton({
  url,
  title,
  calculator,
}: ShareResultButtonProps) {
  const productAnalytics = useProductAnalytics();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2500);

    return () => clearTimeout(timeout);
  }, [copied]);

  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        productAnalytics.capture({
          event: "calculator_result_shared",
          properties: { calculator, method: "native" },
        });

        return;
      } catch (error) {
        // Dismissing the sheet is a choice, not a failure to fall back from.
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    productAnalytics.capture({
      event: "calculator_result_shared",
      properties: { calculator, method: "clipboard" },
    });
  };

  return (
    <div className="flex justify-center">
      <Button
        variant="secondary"
        leftIcon={copied ? <CheckIcon /> : <ShareIcon />}
        onClick={() => void share()}
      >
        <span aria-live="polite">
          {copied ? "Link copied" : "Share these results"}
        </span>
      </Button>
    </div>
  );
}
