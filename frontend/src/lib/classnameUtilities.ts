import { type ClassValue,clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for conditionally joining class names.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 *
 * @param inputs - Class names to join (strings, arrays, objects)
 * @returns Merged and deduplicated class string
 *
 * @example
 * cn("foo", "bar") // "foo bar"
 * cn("foo", false && "bar", "baz") // "foo baz"
 * cn("px-2 py-1", "px-4") // "py-1 px-4" (px-2 overridden)
 * cn({ "active": true, "disabled": false }) // "active"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
