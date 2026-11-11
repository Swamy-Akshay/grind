import { describe, expect, it } from "vitest";
import { buildMonthlyWorkoutSeries, buildWorkoutProgressSeries, buildYearlyWorkoutSeries, estimatedOneRepMax } from "./gym-progress";

describe("gym progress", () => {
  it("groups completed workout facts by date", () => {
    expect(buildWorkoutProgressSeries([{ performedOn: "2026-10-01", setCount: 3, volumeKg: 900 }, { performedOn: "2026-10-01", setCount: 2, volumeKg: 250 }])).toEqual([{ date: "2026-10-01", label: "10-01", workouts: 2, sets: 5, volumeKg: 1150 }]);
  });
  it("calculates an explicitly estimated one-rep maximum", () => expect(estimatedOneRepMax(100, 5)).toBe(116.67));
  it("includes every Monday through Saturday in a monthly series", () => {
    const series = buildMonthlyWorkoutSeries([{ performedOn: "2026-10-03", setCount: 3, volumeKg: 900 }], 2026, 9);
    expect(series).toHaveLength(27);
    expect(series.find((point) => point.date === "2026-10-03")?.volumeKg).toBe(900);
    expect(series.some((point) => point.date === "2026-10-04")).toBe(false);
    expect(series.find((point) => point.date === "2026-10-05")?.volumeKg).toBe(0);
  });
  it("creates exactly 52 chronological yearly buckets", () => {
    const series = buildYearlyWorkoutSeries([{ performedOn: "2026-12-31", setCount: 1, volumeKg: 100 }], 2026);
    expect(series).toHaveLength(52);
    expect(series[51].volumeKg).toBe(100);
    expect(new Set(series.map((point) => point.month)).size).toBe(12);
  });
});
