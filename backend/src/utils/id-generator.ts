export function generateId(prefix = "id"): string {
  const timestamp = Date.now();
  const randomPart = crypto.randomUUID().substring(0, 8);
  return `${prefix}_${timestamp}_${randomPart}`;
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

let lastTimestamp = 0;
let counter = 0;

export function generateNumericId(): number {
  const timestamp = Date.now();
  if (timestamp === lastTimestamp) {
    counter = (counter + 1) % 1000;
  } else {
    lastTimestamp = timestamp;
    counter = Math.floor(Math.random() * 1000);
  }
  return parseInt(`${timestamp}${counter.toString().padStart(3, "0")}`);
}
