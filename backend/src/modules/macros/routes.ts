// src/modules/macros/routes.ts
import { Elysia } from "elysia";
import {
  OpenFoodFactsApiClient,
} from "../../services/openfoodfacts-api-client";
import { registerMacroEntryRoutes } from "./entry-routes";
import { registerMacroSearchRoutes } from "./search-routes";
import { registerMacroTargetRoutes } from "./target-routes";

export const macroRoutes = (app: Elysia) =>
  app.group("/api/macros", (group) => {
    const macroGroup = group
      .decorate("openFoodFactsApiClient", new OpenFoodFactsApiClient());

    registerMacroSearchRoutes(
      macroGroup as unknown as Parameters<typeof registerMacroSearchRoutes>[0],
    );
    registerMacroTargetRoutes(
      macroGroup as unknown as Parameters<typeof registerMacroTargetRoutes>[0],
    );
    registerMacroEntryRoutes(
      macroGroup as unknown as Parameters<typeof registerMacroEntryRoutes>[0],
    );

    return macroGroup;
  });
