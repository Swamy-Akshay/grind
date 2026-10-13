import Link from "next/link";
import { ProgressLineChart } from "@/components/analytics/progress-line-chart";
import { buildProgressSeries, monthBounds, type ProgressPoint } from "@/lib/analytics/daily-progress";
import type { ScoreableTask } from "@/lib/scoring/score";
import { createClient } from "@/lib/supabase/server";

type TaskRow = { id: string; category: "career" | "lifestyle"; priority: number; daily_target_minutes: number };
type EntryRow = { task_id: string; focused_minutes: number; entry_date: string };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).toLocaleDateString("en-CA");
  const today = now.toLocaleDateString("en-CA");
  const [{ data: tasks }, { data: entries, error: entriesError }] = await Promise.all([
    supabase.from("tasks").select("id,category,priority,daily_target_minutes").eq("user_id", user.id).eq("is_active", true),
    supabase.from("daily_entries").select("task_id,focused_minutes,entry_date").eq("user_id", user.id).gte("entry_date", yearStart).lte("entry_date", today),
  ]);
  if (entriesError) throw new Error("Unable to load analytics.");
  const scoreableTasks: ScoreableTask[] = ((tasks ?? []) as TaskRow[]).map((task) => ({ id: task.id, category: task.category, priority: task.priority, targetMinutes: task.daily_target_minutes }));
  const datedEntries = (entries ?? []) as EntryRow[];
  const monthly = Array.from({ length: now.getMonth() + 1 }, (_, month) => {
    const bounds = monthBounds(new Date(now.getFullYear(), month, 1));
    const series = buildProgressSeries(scoreableTasks, datedEntries.map((entry) => ({ taskId: entry.task_id, focusedMinutes: entry.focused_minutes, entryDate: entry.entry_date })), bounds.startDate, bounds.endDate);
    return { label: new Date(now.getFullYear(), month, 1).toLocaleDateString("en", { month: "long" }), series };
  });
  const yearly: ProgressPoint[] = monthly.map(({ label, series }, index) => ({ date: `${now.getFullYear()}-${index + 1}`, label: label.slice(0, 3), score: Math.round((series.reduce((total, point) => total + point.score, 0) / Math.max(series.length, 1)) * 100) / 100, maximum: series[0]?.maximum ?? 0, focusedMinutes: series.reduce((total, point) => total + point.focusedMinutes, 0) }));

  return <main className="mx-auto w-full max-w-6xl px-6 py-10"><Link className="text-sm font-medium underline" href="/daily">← Daily progress</Link><p className="mt-8 text-sm font-semibold tracking-[0.2em] text-slate-500">ANALYTICS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Monthly and yearly progress.</h1><p className="mt-3 text-slate-600">The charts show recorded base scores. They describe your data; they do not infer outcomes or causation.</p><div className="mt-8 space-y-8">{monthly.map(({ label, series }) => <ProgressLineChart data={series} key={label} title={`${label} ${now.getFullYear()}`} />)}</div><div className="mt-10"><ProgressLineChart data={yearly} title={`${now.getFullYear()} yearly progress`} /></div></main>;
}
