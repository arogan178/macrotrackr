export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

export const generateUUID = (): string => crypto.randomUUID();
