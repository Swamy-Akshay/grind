export type WorkoutProgressInput = { performedOn: string; setCount: number; volumeKg: number };
export type WorkoutProgressPoint = { date: string; label: string; workouts: number; sets: number; volumeKg: number; month?: string; axisLabel?: string };

const dayKey = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "UTC" });
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);
const rounded = (value: number) => Math.round(value * 100) / 100;

function totalsByDate(workouts: WorkoutProgressInput[]) {
  const totals = new Map<string, Omit<WorkoutProgressPoint, "label" | "month">>();
  for (const workout of workouts) {
    const current = totals.get(workout.performedOn) ?? { date: workout.performedOn, workouts: 0, sets: 0, volumeKg: 0 };
    current.workouts += 1;
    current.sets += workout.setCount;
    current.volumeKg += workout.volumeKg;
    totals.set(workout.performedOn, current);
  }
  return totals;
}

export function buildWorkoutProgressSeries(workouts: WorkoutProgressInput[]): WorkoutProgressPoint[] {
  return [...totalsByDate(workouts).values()].sort((a, b) => a.date.localeCompare(b.date)).map((point) => ({ ...point, label: point.date.slice(5), volumeKg: rounded(point.volumeKg) }));
}

/** The active gym week runs Monday through Saturday; Sunday is intentionally omitted. */
export function buildWorkingWeekSeries(workouts: WorkoutProgressInput[], selectedDate: string): WorkoutProgressPoint[] {
  const totals = totalsByDate(workouts);
  const selected = new Date(`${selectedDate}T12:00:00Z`);
  const mondayOffset = (selected.getUTCDay() + 6) % 7;
  const monday = addDays(selected, -mondayOffset);
  return Array.from({ length: 6 }, (_, index) => {
    const value = addDays(monday, index);
    const date = dayKey(value);
    const total = totals.get(date);
    return { date, label: value.toLocaleDateString("en", { weekday: "short", day: "numeric", timeZone: "UTC" }), workouts: total?.workouts ?? 0, sets: total?.sets ?? 0, volumeKg: rounded(total?.volumeKg ?? 0) };
  });
}

/** Monday–Saturday dates are shown even when the user did not log a workout. */
export function buildMonthlyWorkoutSeries(workouts: WorkoutProgressInput[], year: number, monthIndex: number): WorkoutProgressPoint[] {
  const totals = totalsByDate(workouts);
  const cursor = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  const points: WorkoutProgressPoint[] = [];
  while (cursor <= end) {
    if (cursor.getUTCDay() !== 0) {
      const date = dayKey(cursor);
      const total = totals.get(date);
      points.push({ date, label: String(cursor.getUTCDate()), workouts: total?.workouts ?? 0, sets: total?.sets ?? 0, volumeKg: rounded(total?.volumeKg ?? 0) });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

/** Exactly 52 chronological weekly buckets. The final bucket absorbs the year-end remainder. */
export function buildYearlyWorkoutSeries(workouts: WorkoutProgressInput[], year: number): WorkoutProgressPoint[] {
  const buckets = Array.from({ length: 52 }, (_, index) => ({ date: `${year}-W${String(index + 1).padStart(2, "0")}`, label: `W${index + 1}`, workouts: 0, sets: 0, volumeKg: 0, month: "", axisLabel: "" }));
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
  let previousMonth = "";
  for (let index = 0; index < buckets.length; index += 1) {
    const bucketStart = addDays(start, index * 7);
    const month = bucketStart.toLocaleDateString("en", { month: "short", timeZone: "UTC" });
    buckets[index].month = month;
    if (month !== previousMonth) buckets[index].axisLabel = month;
    previousMonth = month;
  }
  for (const workout of workouts) {
    const value = new Date(`${workout.performedOn}T12:00:00Z`);
    if (value < start || value > end) continue;
    const day = Math.floor((value.getTime() - start.getTime()) / 86_400_000);
    const bucket = buckets[Math.min(Math.floor(day / 7), 51)];
    bucket.workouts += 1;
    bucket.sets += workout.setCount;
    bucket.volumeKg += workout.volumeKg;
  }
  return buckets.map((point) => ({ ...point, volumeKg: rounded(point.volumeKg) }));
}

export function estimatedOneRepMax(weightKg: number, reps: number) {
  if (weightKg < 0 || reps < 1) throw new Error("Weight and reps must be positive.");
  return Math.round(weightKg * (1 + reps / 30) * 100) / 100;
}
