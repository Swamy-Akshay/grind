import { describe, expect, it } from "vitest";
import { focusedTimeToMinutes, minutesToFocusedTime } from "./focused-time";

describe("focused time conversion", () => {
  it("converts HH:MM into focused minutes", () => expect(focusedTimeToMinutes("01:30")).toBe(90));
  it("treats a blank optional input as zero", () => expect(focusedTimeToMinutes("")).toBe(0));
  it("accepts convenient zero and compact shortcuts", () => {
    expect(focusedTimeToMinutes("0")).toBe(0);
    expect(focusedTimeToMinutes("0015")).toBe(15);
  });
  it("formats stored minutes for a time input", () => expect(minutesToFocusedTime(75)).toBe("01:15"));
  it("rejects invalid values", () => expect(() => focusedTimeToMinutes("1.5")).toThrow());
});
