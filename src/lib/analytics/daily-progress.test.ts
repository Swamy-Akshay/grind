import { describe, expect, it } from "vitest";
import { buildProgressSeries } from "./daily-progress";

describe("daily progress series", () => {
  it("includes checked task completion in the daily score point", () => {
    const tasks = [{ id: "sleep", category: "Lifestyle", priority: 1, targetMinutes: 450, completionMode: "checkbox" as const }];
    const points = buildProgressSeries(tasks, [{ taskId: "sleep", focusedMinutes: 0, isCompleted: true, entryDate: "2026-10-01" }], "2026-10-01", "2026-10-01");
    expect(points[0].score).toBe(1);
  });
});
