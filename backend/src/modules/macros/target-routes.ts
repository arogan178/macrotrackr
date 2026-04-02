import {
  safeQuery,
  type MacroTargetRow,
} from "../../lib/database";
import { BadRequestError, DatabaseError } from "../../lib/errors";
import { loggerHelpers } from "../../lib/logger";
import { MacroSchemas } from "./schemas";
import {
  parseJsonArrayField,
  type MacrosRouteContext,
} from "./service";

export const registerMacroTargetRoutes = (group: any) =>
  group
    .get(
      "/target",
      async (context: any) => {
        const { db, request } = context as MacrosRouteContext;
        const internalUserId = context.authenticatedUser.userId;
        const correlationId = request.headers.get("x-correlation-id") || undefined;

        loggerHelpers.apiRequest("GET", "/macros/target", internalUserId ?? undefined, {
          correlationId,
        });

        const macroTargetResult = safeQuery<MacroTargetRow>(
          db,
          "SELECT * FROM macro_targets WHERE user_id = ?",
          [internalUserId],
        );

        if (!macroTargetResult) {
          loggerHelpers.dbQuery("SELECT", "macro_targets", internalUserId ?? undefined, 0);
          return {
            macroTarget: {
              proteinPercentage: 30,
              carbsPercentage: 40,
              fatsPercentage: 30,
              lockedMacros: [],
            },
          };
        }

        const lockedMacros = parseJsonArrayField<string>(
          macroTargetResult.locked_macros,
          "locked macros",
        );

        return {
          macroTarget: {
            proteinPercentage: macroTargetResult.protein_percentage,
            carbsPercentage: macroTargetResult.carbs_percentage,
            fatsPercentage: macroTargetResult.fats_percentage,
            lockedMacros: lockedMacros.filter(
              (item): item is "protein" | "carbs" | "fats" =>
                ["protein", "carbs", "fats"].includes(item),
            ),
          },
        };
      },
      {
        response: MacroSchemas.getMacroTargetResponse,
        detail: {
          summary: "Get the user's macro target percentages",
          tags: ["Macros", "Goals"],
        },
      },
    )
    .put(
      "/target",
      async (context: any) => {
        const { db, body, request } = context as MacrosRouteContext;
        const internalUserId = context.authenticatedUser.userId;

        if (!body) {
          throw new BadRequestError("Request body is required");
        }

        const correlationId = request.headers.get("x-correlation-id") || undefined;
        loggerHelpers.apiRequest("PUT", "/macros/target", internalUserId ?? undefined, {
          correlationId,
        });

        const macroTarget = (body as { macroTarget?: Record<string, unknown> }).macroTarget;
        const proteinPercentage = macroTarget?.proteinPercentage ?? 30;
        const carbsPercentage = macroTarget?.carbsPercentage ?? 40;
        const fatsPercentage = macroTarget?.fatsPercentage ?? 30;
        const lockedMacrosJson = JSON.stringify(macroTarget?.lockedMacros || []);

        const savedResult = safeQuery<{
          protein_percentage: number;
          carbs_percentage: number;
          fats_percentage: number;
          locked_macros: string;
        }>(
          db,
          `INSERT INTO macro_targets (
             user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros, updated_at
           )
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(user_id) DO UPDATE SET
             protein_percentage = excluded.protein_percentage,
             carbs_percentage = excluded.carbs_percentage,
             fats_percentage = excluded.fats_percentage,
             locked_macros = excluded.locked_macros,
             updated_at = CURRENT_TIMESTAMP
           RETURNING protein_percentage, carbs_percentage, fats_percentage, locked_macros`,
          [
            internalUserId,
            proteinPercentage,
            carbsPercentage,
            fatsPercentage,
            lockedMacrosJson,
          ],
        );

        if (!savedResult) {
          throw new DatabaseError("Failed to save macro targets");
        }

        const lockedMacros = parseJsonArrayField<string>(
          savedResult.locked_macros,
          "locked macros",
        );

        loggerHelpers.dbQuery("UPSERT", "macro_targets", internalUserId ?? undefined, 1);

        return {
          macroTarget: {
            proteinPercentage: savedResult.protein_percentage,
            carbsPercentage: savedResult.carbs_percentage,
            fatsPercentage: savedResult.fats_percentage,
            lockedMacros: lockedMacros.filter(
              (item): item is "protein" | "carbs" | "fats" =>
                ["protein", "carbs", "fats"].includes(item),
            ),
          },
        };
      },
      {
        body: MacroSchemas.updateMacroTargetBody,
        response: MacroSchemas.updateMacroTargetResponse,
        detail: {
          summary: "Save or update the user's macro target percentages",
          tags: ["Macros", "Goals"],
        },
      },
    );
