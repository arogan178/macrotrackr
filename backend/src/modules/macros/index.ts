/**
 * Macros module public API.
 */

export { registerMacroEntryRoutes } from "./entry-routes";
export { macroRoutes } from "./routes";
export {
  getMacroHistory,
  normalizeMacroEntryRow,
  parseJsonArrayField,
  type CacheService,
  type MacroEntryResponse,
  type MacroHistorySummaryItem,
  type MacrosRouteContext,
} from "./service";
export { registerMacroSearchRoutes } from "./search-routes";
export { MacroSchemas, type MacroTargetPercentages } from "./schemas";
export { registerMacroTargetRoutes } from "./target-routes";