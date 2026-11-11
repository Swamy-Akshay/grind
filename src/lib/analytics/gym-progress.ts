import { classifyExercise, type ExerciseMetadata } from "./exercise-classification";

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
  if (weightKg <= 0 || reps < 1) throw new Error("Weight and reps must be positive.");
  return Math.round(weightKg * (1 + reps / 30) * 100) / 100;
}

export type ExerciseSetRecord = {
  workoutId: string;
  performedOn: string;
  exercise: ExerciseMetadata;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
};

export type ExerciseSessionPerformance = {
  workoutId: string;
  performedOn: string;
  exerciseId: string;
  exerciseName: string;
  trackingMode: ExerciseMetadata["trackingMode"];
  totalRecordedSets: number;
  totalRepetitions: number;
  maximumRecordedLoad: number | null;
  bestRepsByLoad: Array<{ weightKg: number; reps: number }>;
  resistanceVolumeLoad: number;
  estimatedOneRepMax: number | null;
};

export type SessionComparison = ExerciseSessionPerformance & {
  previousEstimatedOneRepMax: number | null;
  estimatedOneRepMaxChange: number | null;
  estimatedOneRepMaxPercentChange: number | null;
  repetitionChangeAtSameLoad: number | null;
  loadChangeAtSameRepetitions: number | null;
  allTimeBestEstimatedOneRepMax: number | null;
  isNewPerformanceBest: boolean;
};

const isFiniteNumber = (value: number | null): value is number => typeof value === "number" && Number.isFinite(value);
type ValidResistanceSet = ExerciseSetRecord & { weightKg: number; reps: number; durationSeconds: null };
const isResistanceSet = (set: ExerciseSetRecord): set is ValidResistanceSet => set.exercise.trackingMode === "weight_reps" && set.durationSeconds === null && isFiniteNumber(set.weightKg) && set.weightKg > 0 && isFiniteNumber(set.reps) && set.reps > 0;
const isEligibleE1RmSet = (set: ExerciseSetRecord): set is ValidResistanceSet => isResistanceSet(set) && set.reps <= 12;
const roundedValue = (value: number) => Math.round(value * 100) / 100;

/** Returns null rather than an invented maximum for bodyweight, assisted, timed, or invalid sets. */
export function estimateSetOneRepMax(set: ExerciseSetRecord): number | null {
  return isEligibleE1RmSet(set) ? estimatedOneRepMax(set.weightKg, set.reps) : null;
}

export function calculateResistanceVolumeLoad(sets: ExerciseSetRecord[]): number {
  return roundedValue(sets.filter(isResistanceSet).reduce((total, set) => total + set.weightKg * set.reps, 0));
}

export function buildExerciseSessionPerformances(records: ExerciseSetRecord[]): ExerciseSessionPerformance[] {
  const groups = new Map<string, ExerciseSetRecord[]>();
  for (const record of records) {
    if (!record.workoutId || !record.performedOn || !record.exercise.id) continue;
    const key = `${record.exercise.id}:${record.workoutId}`;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return [...groups.values()].map((sets) => {
    const first = sets[0];
    const validResistance = sets.filter(isResistanceSet);
    const bestReps = new Map<number, number>();
    for (const set of validResistance) bestReps.set(set.weightKg, Math.max(bestReps.get(set.weightKg) ?? 0, set.reps));
    const estimates = sets.map(estimateSetOneRepMax).filter(isFiniteNumber);
    return {
      workoutId: first.workoutId,
      performedOn: first.performedOn,
      exerciseId: first.exercise.id,
      exerciseName: first.exercise.name,
      trackingMode: first.exercise.trackingMode,
      totalRecordedSets: sets.length,
      totalRepetitions: sets.reduce((total, set) => total + (isFiniteNumber(set.reps) && set.reps > 0 ? set.reps : 0), 0),
      maximumRecordedLoad: validResistance.length ? Math.max(...validResistance.map((set) => set.weightKg)) : null,
      bestRepsByLoad: [...bestReps.entries()].sort(([left], [right]) => left - right).map(([weightKg, reps]) => ({ weightKg, reps })),
      resistanceVolumeLoad: calculateResistanceVolumeLoad(sets),
      estimatedOneRepMax: estimates.length ? Math.max(...estimates) : null,
    };
  }).sort((left, right) => left.performedOn.localeCompare(right.performedOn) || left.workoutId.localeCompare(right.workoutId));
}

function bestRepsAtMatchingLoad(current: ExerciseSessionPerformance, previous: ExerciseSessionPerformance) {
  const previousByLoad = new Map(previous.bestRepsByLoad.map((point) => [point.weightKg, point.reps]));
  const differences = current.bestRepsByLoad.flatMap((point) => previousByLoad.has(point.weightKg) ? [point.reps - (previousByLoad.get(point.weightKg) ?? 0)] : []);
  return differences.length ? Math.max(...differences) : null;
}

function loadAtMatchingRepetitions(current: ExerciseSessionPerformance, previous: ExerciseSessionPerformance) {
  const loadsForReps = (session: ExerciseSessionPerformance) => {
    const values = new Map<number, number>();
    for (const point of session.bestRepsByLoad) values.set(point.reps, Math.max(values.get(point.reps) ?? -Infinity, point.weightKg));
    return values;
  };
  const previousByReps = loadsForReps(previous); const currentByReps = loadsForReps(current);
  const differences = [...currentByReps.entries()].flatMap(([reps, load]) => previousByReps.has(reps) ? [load - (previousByReps.get(reps) ?? 0)] : []);
  return differences.length ? Math.max(...differences) : null;
}

export function compareExerciseSessions(records: ExerciseSetRecord[]): SessionComparison[] {
  const sessions = buildExerciseSessionPerformances(records);
  const output: SessionComparison[] = [];
  const byExercise = new Map<string, ExerciseSessionPerformance[]>();
  for (const session of sessions) {
    byExercise.set(session.exerciseId, [...(byExercise.get(session.exerciseId) ?? []), session]);
  }
  for (const exerciseSessions of byExercise.values()) {
    exerciseSessions.sort((left, right) => left.performedOn.localeCompare(right.performedOn) || left.workoutId.localeCompare(right.workoutId));
    let best = -Infinity;
    for (let index = 0; index < exerciseSessions.length; index += 1) {
      const current = exerciseSessions[index]; const previous = exerciseSessions[index - 1];
      const currentEstimate = current.estimatedOneRepMax;
      const previousEstimate = previous?.estimatedOneRepMax ?? null;
      const change = currentEstimate !== null && previousEstimate !== null ? roundedValue(currentEstimate - previousEstimate) : null;
      const percentage = change !== null && previousEstimate !== null && previousEstimate !== 0 ? roundedValue((change / previousEstimate) * 100) : null;
      const newBest = currentEstimate !== null && currentEstimate > best;
      if (currentEstimate !== null) best = Math.max(best, currentEstimate);
      output.push({ ...current, previousEstimatedOneRepMax: previousEstimate, estimatedOneRepMaxChange: change, estimatedOneRepMaxPercentChange: percentage, repetitionChangeAtSameLoad: previous ? bestRepsAtMatchingLoad(current, previous) : null, loadChangeAtSameRepetitions: previous ? loadAtMatchingRepetitions(current, previous) : null, allTimeBestEstimatedOneRepMax: Number.isFinite(best) ? best : null, isNewPerformanceBest: newBest });
    }
  }
  return output.sort((left, right) => left.performedOn.localeCompare(right.performedOn) || left.workoutId.localeCompare(right.workoutId));
}

export type LoggedSetSummary = { byPrimaryMuscle: Record<string, number>; byExercise: Record<string, number>; totalLoggedSets: number };

export function summarizeLoggedSets(records: ExerciseSetRecord[], startDate: string, endDate: string): LoggedSetSummary {
  const byPrimaryMuscle: Record<string, number> = {}; const byExercise: Record<string, number> = {};
  for (const record of records) {
    if (!record.performedOn || record.performedOn < startDate || record.performedOn > endDate) continue;
    const primary = classifyExercise(record.exercise).primary;
    byPrimaryMuscle[primary] = (byPrimaryMuscle[primary] ?? 0) + 1;
    byExercise[record.exercise.id] = (byExercise[record.exercise.id] ?? 0) + 1;
  }
  return { byPrimaryMuscle, byExercise, totalLoggedSets: Object.values(byExercise).reduce((total, count) => total + count, 0) };
}

function shiftCalendarDate(date: string, days: number) { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }

export function buildLoggedSetWindows(records: ExerciseSetRecord[], endDate: string) {
  return { weekly: summarizeLoggedSets(records, shiftCalendarDate(endDate, -6), endDate), fourteenDay: summarizeLoggedSets(records, shiftCalendarDate(endDate, -13), endDate) };
}

export type ConsistencyResult = { plannedSessions: number; completedPlannedSessions: number; consistencyPercent: number };

/** Completed dates outside the explicit plan are intentionally excluded from this metric. */
export function calculateWorkoutConsistency(plannedDates: string[], completedDates: string[]): ConsistencyResult {
  const planned = new Set(plannedDates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)));
  const completed = new Set(completedDates.filter((date) => planned.has(date)));
  return { plannedSessions: planned.size, completedPlannedSessions: completed.size, consistencyPercent: planned.size ? roundedValue((completed.size / planned.size) * 100) : 0 };
}
