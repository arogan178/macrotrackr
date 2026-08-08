export const createMutationErrorLogger = (context: string) => (error: unknown) => {
  console.error(context, error);
};
