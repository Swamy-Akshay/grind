import { describe, expect, it } from "vitest";
import { buildWorkoutProgressSeries, estimatedOneRepMax } from "./gym-progress";

describe("gym progress", () => {
  it("groups completed workout facts by date", () => {
    expect(buildWorkoutProgressSeries([{ performedOn: "2026-10-01", setCount: 3, volumeKg: 900 }, { performedOn: "2026-10-01", setCount: 2, volumeKg: 250 }])).toEqual([{ date: "2026-10-01", label: "10-01", workouts: 2, sets: 5, volumeKg: 1150 }]);
  });
  it("calculates an explicitly estimated one-rep maximum", () => expect(estimatedOneRepMax(100, 5)).toBe(116.67));
});
