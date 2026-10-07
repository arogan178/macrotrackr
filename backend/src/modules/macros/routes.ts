// src/modules/macros/routes.ts
import { Elysia } from "elysia";
import {
  OpenFoodFactsApiClient,
} from "../../services/openfoodfacts-api-client";
import { macroEntryRoutes } from "./entry-routes";
import { macroSearchRoutes } from "./search-routes";
import { macroTargetRoutes } from "./target-routes";

export const macroRoutes = new Elysia({ prefix: "/api/macros" })
  .decorate("openFoodFactsApiClient", new OpenFoodFactsApiClient())
  .use(macroSearchRoutes)
  .use(macroTargetRoutes)
  .use(macroEntryRoutes);
