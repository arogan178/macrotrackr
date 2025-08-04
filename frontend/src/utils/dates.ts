// Date utilities
// File: [frontend/src/utils/dates.ts](frontend/src/utils/dates.ts:1)

/**
 * Returns today's date in ISO YYYY-MM-DD format, matching the previous logic
 * from [frontend/src/features/macroTracking/pages/HomePage.tsx](frontend/src/features/macroTracking/pages/HomePage.tsx:39)
 * which used new Date().toISOString().split('T')[0].
 */
export function getTodayISO(): string {
  // Keep consistent with existing behavior: UTC-based date component
  return new Date().toISOString().split('T')[0]!;
}

/**
 * Returns a display date string using en-US short format.
 * Mirrors the current HomePage subtitle formatting:
 * [frontend/src/features/macroTracking/pages/HomePage.tsx](frontend/src/features/macroTracking/pages/HomePage.tsx:157)
 */
export function getDisplayDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}