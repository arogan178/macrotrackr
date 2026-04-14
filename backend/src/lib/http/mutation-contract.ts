import { t } from "elysia";

export const mutationSuccessResponseSchema = t.Object({
  success: t.Boolean(),
});

export const mutationSuccessWithMessageResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
});

export const mutationSuccessWithStringIdResponseSchema = t.Object({
  success: t.Boolean(),
  id: t.String(),
});

export const mutationSuccessWithNumericIdResponseSchema = t.Object({
  success: t.Boolean(),
  id: t.Numeric(),
});

export function mutationSuccess() {
  return { success: true as const };
}

export function mutationSuccessWithMessage(message: string) {
  return {
    success: true as const,
    message,
  };
}

export function mutationSuccessWithId<T extends string | number>(id: T) {
  return {
    success: true as const,
    id,
  };
}
