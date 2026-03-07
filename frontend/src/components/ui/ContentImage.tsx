import type { ImgHTMLAttributes } from "react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/classnameUtilities";

interface ContentImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "alt"> {
  alt: string;
  containerClassName?: string;
}

export default function ContentImage({
  alt,
  className,
  containerClassName,
  src,
  loading = "lazy",
  decoding = "async",
  onError,
  onLoad,
  ...properties
}: ContentImageProps) {
  const [isLoaded, setIsLoaded] = useState(!src);

  useEffect(() => {
    setIsLoaded(!src);
  }, [src]);

  if (!src) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-2",
        containerClassName,
      )}
    >
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-linear-to-br from-surface-2 via-surface-3 to-surface-2" />
      )}
      <img
        {...properties}
        alt={alt}
        src={src}
        loading={loading}
        decoding={decoding}
        onLoad={(event) => {
          setIsLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setIsLoaded(true);
          onError?.(event);
        }}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </div>
  );
}
