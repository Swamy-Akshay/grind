export function focusedTimeToMinutes(value: string) {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "0") return 0;
  const normalized = /^\d{1,4}$/.test(trimmed) ? trimmed.padStart(4, "0").replace(/(\d{2})(\d{2})/, "$1:$2") : trimmed;
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(normalized);
  if (!match) throw new Error("Enter time as HH:MM, for example 00:45.");
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToFocusedTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}
