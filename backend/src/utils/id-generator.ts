/**
 * Generates a unique ID with optional prefix
 * @param prefix - Optional prefix for the ID (default: "id")
 * @returns A unique string ID in format: prefix_timestamp_randomstring
 */
export function generateId(prefix = "id"): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomPart}`;
}

/**
 * Generates a simple UUID-like string (not cryptographically secure)
 * @returns A UUID-like string
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a numeric ID based on timestamp and random number
 * @returns A numeric ID
 */
export function generateNumericId(): number {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return parseInt(`${timestamp}${random.toString().padStart(3, "0")}`);
}
