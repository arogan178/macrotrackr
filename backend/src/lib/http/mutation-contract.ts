export function mutationSuccess() {
  return { success: true as const };
}

export function mutationSuccessWithId<T extends string | number>(id: T) {
  return {
    success: true as const,
    id,
  };
}
