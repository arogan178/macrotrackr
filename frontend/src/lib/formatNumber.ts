/**
 * One spelling for every figure the product prints.
 *
 * The app shipped a daily target as both "2000 kcal" and "2,000 kcal", and the
 * split ran straight through the primitive that exists to prevent exactly that:
 * `Value` formatted with `toLocaleString` and grouped, while the
 * `AnimatedNumber` it delegates to formatted with `toFixed` and did not. The
 * same call site changed spelling when someone added `animate`.
 *
 * Grouped is the house standard. It is what `Value` already did, and the type
 * scale was chosen partly to carry it: Archivo's width axis exists here so a
 * condensed "2,140 kcal" fits a 390px column, which is an argument about the
 * grouped form. Every separator in the product comes from this function, so
 * changing the standard is a one-line change here rather than a sweep.
 *
 * Locale-aware by design: `undefined` follows the reader's locale, so a German
 * reader gets "2.140". Do not pass "en-US" to force a comma — the figures are
 * read, not parsed.
 */
export function formatGrouped(value: number, decimals = 0): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return safeValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
