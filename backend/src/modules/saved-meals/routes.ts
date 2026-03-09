// src/modules/saved-meals/routes.ts
import { Elysia, t } from "elysia";
import { db } from "../../db";
import type { AuthenticatedRouteContext } from "../../types";
import { transformKeysToCamel } from "../../lib/mappers";
import {
  safeQuery,
  safeExecute,
  safeQueryAll,
} from "../../lib/database";
import { NotFoundError, AuthorizationError } from "../../lib/errors";
import {
  checkProStatus,
  checkFeatureLimit,
  FREE_TIER_LIMITS,
} from "../../middleware/clerk-guards";

// Saved meal row type
interface SavedMealRow {
  id: number;
  user_id: number;
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  meal_type: string;
  ingredients: string;
  created_at: string;
  updated_at: string;
}

// Extended context type
type SavedMealsRouteContext = AuthenticatedRouteContext<Record<string, unknown>>;

// Schemas
const SavedMealSchemas = {
  savedMealResponse: t.Object({
    id: t.Number(),
    userId: t.Number(),
    name: t.String(),
    protein: t.Number(),
    carbs: t.Number(),
    fats: t.Number(),
    mealType: t.String(),
    createdAt: t.String(),
    updatedAt: t.String(),
  ingredients: t.Optional(t.Any()),
  }),

  createSavedMealBody: t.Object({
    name: t.String({ minLength: 1, maxLength: 100 }),
    protein: t.Number({ minimum: 0 }),
    carbs: t.Number({ minimum: 0 }),
    fats: t.Number({ minimum: 0 }),
    mealType: t.Optional(
      t.Union([
        t.Literal("breakfast"),
        t.Literal("lunch"),
        t.Literal("dinner"),
        t.Literal("snack"),
      ])
    ),
    ingredients: t.Optional(t.Any()),
  }),

  updateSavedMealBody: t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
    protein: t.Optional(t.Number({ minimum: 0 })),
    carbs: t.Optional(t.Number({ minimum: 0 })),
    fats: t.Optional(t.Number({ minimum: 0 })),
    mealType: t.Optional(
      t.Union([
        t.Literal("breakfast"),
        t.Literal("lunch"),
        t.Literal("dinner"),
        t.Literal("snack"),
      ])
    ),
    ingredients: t.Optional(t.Any()),
  }),

  mealIdParam: t.Object({
    id: t.Numeric(),
  }),
};

export const savedMealRoutes = (app: Elysia) =>
  app.group("/api/saved-meals", (group) =>
    group
      .decorate("db", db)

      // GET / - List all saved meals for the user
      .get(
        "/",
        async (context: any) => {
          const { db, internalUserId } = context as SavedMealsRouteContext;

          if (!internalUserId) {
            throw new Error("User ID is required");
          }

          const userId = internalUserId as number;

          const meals = safeQueryAll<SavedMealRow>(
            db,
            `SELECT id, user_id, name, protein, carbs, fats, meal_type, ingredients, created_at, updated_at
             FROM saved_meals
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
          );

          return {
            meals: meals.map((m) => {
              const camel = transformKeysToCamel(m as unknown as Record<string, unknown>) as any;
              if (camel.ingredients) {
                try {
                  camel.ingredients = JSON.parse(camel.ingredients);
                } catch {
                  camel.ingredients = [];
                }
              }
              return camel;
            }),
            count: meals.length,
            limit: FREE_TIER_LIMITS.MAX_SAVED_MEALS,
            isPro: await checkProStatus(userId),
          };
        },
        {
          response: t.Object({
            meals: t.Array(SavedMealSchemas.savedMealResponse),
            count: t.Number(),
            limit: t.Number(),
            isPro: t.Boolean(),
          }),
          detail: {
            summary: "Get all saved meals for the user",
            tags: ["Saved Meals"],
          },
        }
      )

      // POST / - Create a new saved meal
      .post(
        "/",
        async (context: any) => {
          const { db, internalUserId, body } = context as SavedMealsRouteContext;

          if (!internalUserId) {
            throw new Error("User ID is required");
          }

          const userId = internalUserId as number;

          if (!body) {
            throw new Error("Request body is required");
          }

          // Check feature limit for free users
          const currentCount = safeQueryAll<SavedMealRow>(
            db,
            "SELECT id FROM saved_meals WHERE user_id = ?",
            [userId]
          ).length;

          const limitCheck = await checkFeatureLimit(
            userId,
            "MAX_SAVED_MEALS",
            currentCount
          );

          if (!limitCheck.allowed) {
            throw new AuthorizationError(
              limitCheck.message || "Saved meals limit reached"
            );
          }

          const { name, protein, carbs, fats, mealType = "snack", ingredients } = body as {
            name: string;
            protein: number;
            carbs: number;
            fats: number;
            mealType?: string;
            ingredients?: any[];
          };

          const ingredientsStr = ingredients ? JSON.stringify(ingredients) : '[]';

          const result = safeQuery<SavedMealRow>(
            db,
            `INSERT INTO saved_meals (user_id, name, protein, carbs, fats, meal_type, ingredients)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             RETURNING id, user_id, name, protein, carbs, fats, meal_type, ingredients, created_at, updated_at`,
            [userId, name, protein, carbs, fats, mealType, ingredientsStr]
          );

          if (!result) {
            throw new Error("Failed to create saved meal");
          }

          const camelResult = transformKeysToCamel(result as unknown as Record<string, unknown>) as any;
          if (camelResult.ingredients) {
            try {
              camelResult.ingredients = JSON.parse(camelResult.ingredients);
            } catch {
              camelResult.ingredients = [];
            }
          }
          return camelResult;
        },
        {
          body: SavedMealSchemas.createSavedMealBody,
          response: SavedMealSchemas.savedMealResponse,
          detail: {
            summary: "Create a new saved meal",
            tags: ["Saved Meals"],
          },
        }
      )

      // PUT /:id - Update a saved meal
      .put(
        "/:id",
        async (context: any) => {
          const { db, internalUserId, params, body } =
            context as SavedMealsRouteContext;

          if (!internalUserId) {
            throw new Error("User ID is required");
          }

          const userId = internalUserId as number;
          const mealId = params?.id;

          if (!mealId) {
            throw new NotFoundError("Saved meal ID is required");
          }

          if (!body) {
            throw new Error("Request body is required");
          }

          // Build update object
          const updates: Record<string, unknown> = {};
          if (body.name !== undefined) updates.name = body.name;
          if (body.protein !== undefined) updates.protein = body.protein;
          if (body.carbs !== undefined) updates.carbs = body.carbs;
          if (body.fats !== undefined) updates.fats = body.fats;
          if (body.mealType !== undefined) updates.meal_type = body.mealType;
          if (body.ingredients !== undefined) updates.ingredients = JSON.stringify(body.ingredients);

          const fieldsToUpdate = Object.keys(updates);
          if (fieldsToUpdate.length === 0) {
            throw new Error("No valid fields provided for update.");
          }

          const setClause = fieldsToUpdate
            .map((field) => `${field} = ?`)
            .join(", ");
          const queryParams: (string | number)[] = [
            ...(Object.values(updates) as (string | number)[]),
            Number(mealId),
            userId,
          ];

          const result = safeQuery<SavedMealRow>(
            db,
            `UPDATE saved_meals SET ${setClause}, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?
             RETURNING id, user_id, name, protein, carbs, fats, meal_type, ingredients, created_at, updated_at`,
            queryParams
          );

          if (!result) {
            throw new NotFoundError(
              `Saved meal with ID ${mealId} not found or access denied.`
            );
          }

          const camelResult = transformKeysToCamel(result as unknown as Record<string, unknown>) as any;
          if (camelResult.ingredients) {
            try {
              camelResult.ingredients = JSON.parse(camelResult.ingredients);
            } catch {
              camelResult.ingredients = [];
            }
          }
          return camelResult;
        },
        {
          params: SavedMealSchemas.mealIdParam,
          body: SavedMealSchemas.updateSavedMealBody,
          response: SavedMealSchemas.savedMealResponse,
          detail: {
            summary: "Update a saved meal",
            tags: ["Saved Meals"],
          },
        }
      )

      // DELETE /:id - Delete a saved meal
      .delete(
        "/:id",
        async (context: any) => {
          const { db, internalUserId, params } =
            context as SavedMealsRouteContext;

          if (!internalUserId) {
            throw new Error("User ID is required");
          }

          const userId = internalUserId as number;
          const mealId = params?.id;

          if (!mealId) {
            throw new NotFoundError("Saved meal ID is required");
          }

          const result = safeExecute(
            db,
            "DELETE FROM saved_meals WHERE id = ? AND user_id = ?",
            [mealId, userId]
          );

          if (result.changes === 0) {
            throw new NotFoundError(
              `Saved meal with ID ${mealId} not found or access denied.`
            );
          }

          return {
            success: true,
            id: Number(mealId),
          };
        },
        {
          params: SavedMealSchemas.mealIdParam,
          response: t.Object({
            success: t.Boolean(),
            id: t.Numeric(),
          }),
          detail: {
            summary: "Delete a saved meal",
            tags: ["Saved Meals"],
          },
        }
      )
  );
