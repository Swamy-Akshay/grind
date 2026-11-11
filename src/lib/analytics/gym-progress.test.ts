import { describe, expect, it } from "vitest";
import { buildExerciseSessionPerformances, buildLoggedSetWindows, buildMonthlyWorkoutSeries, buildWorkingWeekSeries, buildWorkoutProgressSeries, buildYearlyWorkoutSeries, calculateResistanceVolumeLoad, calculateWorkoutConsistency, compareExerciseSessions, estimateSetOneRepMax, estimatedOneRepMax, summarizeLoggedSets, type ExerciseSetRecord } from "./gym-progress";
import { classifyExercise } from "./exercise-classification";

const chest = { id: "bench", name: "Incline Barbell Bench Press", muscleGroup: "Chest", trackingMode: "weight_reps" as const };
const biceps = { id: "curl", name: "DB Curl", muscleGroup: "Biceps", trackingMode: "weight_reps" as const };
const forearms = { id: "wrist", name: "Wrist Curl", muscleGroup: "Biceps", trackingMode: "weight_reps" as const };
const plank = { id: "plank", name: "Plank", muscleGroup: "Core", trackingMode: "duration" as const };
const set = (overrides: Partial<ExerciseSetRecord> = {}): ExerciseSetRecord => ({ workoutId: "workout-1", performedOn: "2026-10-01", exercise: chest, setNumber: 1, weightKg: 100, reps: 5, durationSeconds: null, ...overrides });

describe("gym chart series", () => {
  it("groups completed workout facts by date", () => expect(buildWorkoutProgressSeries([{ performedOn: "2026-10-01", setCount: 3, volumeKg: 900 }, { performedOn: "2026-10-01", setCount: 2, volumeKg: 250 }])).toEqual([{ date: "2026-10-01", label: "10-01", workouts: 2, sets: 5, volumeKg: 1150 }]));
  it("includes every Monday through Saturday in a monthly series", () => {
    const series = buildMonthlyWorkoutSeries([{ performedOn: "2026-10-03", setCount: 3, volumeKg: 900 }], 2026, 9);
    expect(series).toHaveLength(27); expect(series.find((point) => point.date === "2026-10-03")?.volumeKg).toBe(900); expect(series.some((point) => point.date === "2026-10-04")).toBe(false); expect(series.find((point) => point.date === "2026-10-05")?.volumeKg).toBe(0);
  });
  it("creates 52 yearly buckets and 12 month labels", () => {
    const series = buildYearlyWorkoutSeries([{ performedOn: "2026-12-31", setCount: 1, volumeKg: 100 }], 2026);
    expect(series).toHaveLength(52); expect(series[51].volumeKg).toBe(100); expect(new Set(series.map((point) => point.month)).size).toBe(12); expect(series.filter((point) => point.axisLabel)).toHaveLength(12);
  });
  it("includes Monday through Saturday for the selected working week", () => expect(buildWorkingWeekSeries([{ performedOn: "2026-10-03", setCount: 2, volumeKg: 500 }], "2026-10-03").map((point) => point.date)).toEqual(["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"]));
});

describe("exercise performance", () => {
  it("uses Epley only for eligible positive-load sets", () => {
    expect(estimatedOneRepMax(100, 5)).toBe(116.67);
    expect(() => estimatedOneRepMax(0, 5)).toThrow();
    expect(estimateSetOneRepMax(set())).toBe(116.67);
    expect(estimateSetOneRepMax(set({ weightKg: 0 }))).toBeNull();
    expect(estimateSetOneRepMax(set({ weightKg: -20 }))).toBeNull();
    expect(estimateSetOneRepMax(set({ reps: 13 }))).toBeNull();
    expect(estimateSetOneRepMax(set({ exercise: plank, weightKg: null, reps: null, durationSeconds: 60 }))).toBeNull();
  });
  it("excludes duration, zero-load, assisted, and invalid repetitions from resistance volume", () => {
    expect(calculateResistanceVolumeLoad([set(), set({ weightKg: 0 }), set({ weightKg: -20 }), set({ reps: 0 }), set({ exercise: plank, weightKg: null, reps: null, durationSeconds: 60 })])).toBe(500);
  });
  it("groups sessions by exact exercise ID and workout, never by muscle group", () => {
    const sessions = buildExerciseSessionPerformances([set(), set({ setNumber: 2, reps: 8 }), set({ workoutId: "workout-2", exercise: biceps, weightKg: 20, reps: 10 })]);
    const bench = sessions.find((session) => session.exerciseId === "bench");
    expect(sessions).toHaveLength(2); expect(bench).toMatchObject({ totalRecordedSets: 2, totalRepetitions: 13, maximumRecordedLoad: 100, resistanceVolumeLoad: 1300, bestRepsByLoad: [{ weightKg: 100, reps: 8 }] }); expect(sessions.find((session) => session.exerciseId === "curl")?.resistanceVolumeLoad).toBe(200);
  });
  it("reports rep and load improvements only against the preceding same-exercise session", () => {
    const comparisons = compareExerciseSessions([
      set({ workoutId: "one", performedOn: "2026-10-01", weightKg: 80, reps: 8 }),
      set({ workoutId: "two", performedOn: "2026-10-08", weightKg: 80, reps: 10 }),
      set({ workoutId: "three", performedOn: "2026-10-15", weightKg: 85, reps: 10 }),
      set({ workoutId: "other", performedOn: "2026-10-16", exercise: biceps, weightKg: 30, reps: 8 }),
    ]);
    const second = comparisons.find((session) => session.workoutId === "two"); const third = comparisons.find((session) => session.workoutId === "three");
    expect(second?.repetitionChangeAtSameLoad).toBe(2); expect(second?.estimatedOneRepMaxPercentChange).toBeGreaterThan(0); expect(third?.loadChangeAtSameRepetitions).toBe(5); expect(third?.isNewPerformanceBest).toBe(true); expect(comparisons.find((session) => session.workoutId === "other")?.previousEstimatedOneRepMax).toBeNull();
  });
});

describe("muscle and consistency analytics", () => {
  it("keeps recognized forearm work separate from the broad Biceps UI group and falls back safely", () => {
    expect(classifyExercise(forearms).primary).toBe("Forearms");
    expect(classifyExercise({ id: "rotation", name: "Cable External Rotation", muscleGroup: "Shoulders", trackingMode: "weight_reps" }).primary).toBe("Shoulders");
    expect(classifyExercise({ id: "custom", name: "My custom movement", muscleGroup: "Custom group", trackingMode: "weight_reps" }).primary).toBe("Custom group");
  });
  it("counts each logged set once toward only its primary muscle and exercise", () => {
    const summary = summarizeLoggedSets([set({ exercise: forearms }), set({ exercise: chest, setNumber: 2 })], "2026-10-01", "2026-10-07");
    expect(summary).toEqual({ byPrimaryMuscle: { Forearms: 1, Chest: 1 }, byExercise: { wrist: 1, bench: 1 }, totalLoggedSets: 2 });
  });
  it("builds inclusive weekly and 14-day logged-set windows without timezone shifts", () => {
    const windows = buildLoggedSetWindows([set({ performedOn: "2026-10-01" }), set({ performedOn: "2026-10-08", setNumber: 2 }), set({ performedOn: "2026-10-14", setNumber: 3 })], "2026-10-14");
    expect(windows.weekly.totalLoggedSets).toBe(2); expect(windows.fourteenDay.totalLoggedSets).toBe(3);
  });
  it("uses explicit planned dates only for consistency and handles no plan safely", () => {
    expect(calculateWorkoutConsistency(["2026-10-01", "2026-10-03", "2026-10-05"], ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-03"])).toEqual({ plannedSessions: 3, completedPlannedSessions: 2, consistencyPercent: 66.67 });
    expect(calculateWorkoutConsistency([], ["2026-10-01"])).toEqual({ plannedSessions: 0, completedPlannedSessions: 0, consistencyPercent: 0 });
  });
  it("handles empty history and missing workout dates without fabricating sets", () => {
    expect(buildExerciseSessionPerformances([])).toEqual([]);
    expect(summarizeLoggedSets([set({ performedOn: "" })], "2026-10-01", "2026-10-07").totalLoggedSets).toBe(0);
  });
});
