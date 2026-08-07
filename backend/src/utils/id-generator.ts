export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

export const generateUUID = (): string => crypto.randomUUID();

export function generateNumericId(): number {
  return Number(`${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`);
}
