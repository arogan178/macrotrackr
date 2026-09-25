import { useEffect, useRef } from "react";

/** The inputs a shared result link carries, as query parameters. */
export type SharedInputs = Record<string, number | string>;

export interface SharedInputReader {
  number: (key: string, min: number, max: number) => number | undefined;
  oneOf: <T extends string>(
    key: string,
    options: readonly T[],
  ) => T | undefined;
}

/**
 * Applies the inputs carried by a shared result link, once, on arrival. Runs
 * after mount because the prerendered page has no query string and hydration
 * has to match it first. Anything missing or out of range keeps its default.
 */
export function useSharedInputs(apply: (read: SharedInputReader) => void) {
  const applyOnArrival = useRef(apply);

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    if (params.size === 0) return;

    applyOnArrival.current({
      number: (key, min, max) => {
        const raw = params.get(key);
        // Number("") is 0, which would pass a zero minimum.
        if (!raw) return undefined;
        const value = Number(raw);

        return Number.isFinite(value) && value >= min && value <= max
          ? value
          : undefined;
      },
      oneOf: (key, options) =>
        options.find((option) => option === params.get(key)),
    });
  }, []);
}

export function buildShareUrl(canonicalUrl: string, inputs: SharedInputs) {
  const params = new URLSearchParams(
    Object.entries(inputs).map(([key, value]) => [key, String(value)]),
  );

  return `${canonicalUrl}?${params.toString()}`;
}
