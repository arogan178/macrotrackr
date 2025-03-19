/**
 * Generates a unique notification ID
 */
export function generateUniqueId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
