export function getLocalDate(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  const parts = adjustedDate.toISOString().split("T");
  return parts[0] ?? adjustedDate.toISOString().substring(0, 10);
}
