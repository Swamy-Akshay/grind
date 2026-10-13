import { describe, expect, it } from "vitest";
import { calculateDailyScore, scoreTask } from "./score";

const dsa = { id: "dsa", category: "Career", priority: 1, targetMinutes: 120 };

describe("scoreTask", () => {
  it("scores partial completion", () => expect(scoreTask(dsa, 60, 10).basePoints).toBe(5));
  it("caps points and stores excess focused time separately", () => {
    const score = scoreTask(dsa, 360, 10);
    expect(score.basePoints).toBe(10);
    expect(score.bonusMinutes).toBe(240);
  });
  it("preserves two-decimal partial scores", () => expect(scoreTask({ ...dsa, targetMinutes: 90 }, 60, 10).basePoints).toBe(6.67));
  it("scores zero minutes as zero", () => expect(scoreTask(dsa, 0, 10).basePoints).toBe(0));
  it("rejects invalid targets and negative time", () => {
    expect(() => scoreTask({ ...dsa, targetMinutes: 0 }, 1)).toThrow();
    expect(() => scoreTask(dsa, -1, 10)).toThrow();
  });
});

describe("calculateDailyScore", () => {
  it("keeps category scores separate and derives its maximum from active tasks", () => {
    const score = calculateDailyScore([dsa, { id: "read", category: "Lifestyle", priority: 2, targetMinutes: 30 }], [{ taskId: "dsa", focusedMinutes: 120 }, { taskId: "read", focusedMinutes: 15 }]);
    expect(score.basePoints).toBe(2.5);
    expect(score.maximumBasePoints).toBe(3);
    expect(score.byCategory).toEqual({ Career: 2, Lifestyle: 0.5 });
  });
  it("rewards serial number 1 more than the last task", () => {
    const score = calculateDailyScore([{ ...dsa, id: "first" }, { ...dsa, id: "last", priority: 2 }], [{ taskId: "first", focusedMinutes: 120 }, { taskId: "last", focusedMinutes: 120 }]);
    expect(score.taskScores[0].rewardPoints).toBe(2);
    expect(score.taskScores[1].rewardPoints).toBe(1);
  });
});
