export function generateId(prefix = "id"): string {
  const timestamp = Date.now();
  const randomPart = crypto.randomUUID().substring(0, 8);
  return `${prefix}_${timestamp}_${randomPart}`;
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function generateNumericId(): number {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return parseInt(`${timestamp}${random.toString().padStart(3, "0")}`);
}
