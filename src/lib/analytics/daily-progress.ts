import { calculateDailyScore, type ScoreableEntry, type ScoreableTask } from "@/lib/scoring/score";

export type DatedEntry = ScoreableEntry & { entryDate: string };
export type ProgressPoint = { date: string; label: string; score: number; maximum: number; focusedMinutes: number };

export function buildProgressSeries(tasks: ScoreableTask[], entries: DatedEntry[], startDate: string, endDate: string): ProgressPoint[] {
  const entriesByDate = new Map<string, ScoreableEntry[]>();
  for (const entry of entries) entriesByDate.set(entry.entryDate, [...(entriesByDate.get(entry.entryDate) ?? []), entry]);
  const points: ProgressPoint[] = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  while (cursor <= end) {
    const date = cursor.toLocaleDateString("en-CA");
    const score = calculateDailyScore(tasks, entriesByDate.get(date) ?? []);
    points.push({ date, label: cursor.toLocaleDateString("en", { month: "short", day: "numeric" }), score: score.basePoints, maximum: score.maximumBasePoints, focusedMinutes: score.focusedMinutes });
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

export function monthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { startDate: start.toLocaleDateString("en-CA"), endDate: end.toLocaleDateString("en-CA") };
}
