import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { ProgressLineChart } from "@/components/analytics/progress-line-chart";
import { DailyTaskRow } from "@/components/daily/daily-task-row";
import { TaskAreaManager } from "@/components/daily/task-area-manager";
import { TaskPlanManager } from "@/components/daily/task-plan-manager";
import { buildProgressSeries, monthBounds } from "@/lib/analytics/daily-progress";
import { calculateDailyScore, type ScoreableTask } from "@/lib/scoring/score";
import { createClient } from "@/lib/supabase/server";

type DailyPageProps = { searchParams: Promise<{ date?: string }> };
type TaskRow = { id: string; name: string; category: string; priority: number; daily_target_minutes: number; completion_mode: "focused_time" | "checkbox" };
type EntryRow = { id: string; task_id: string; focused_minutes: number; is_completed?: boolean; entry_date?: string };
type OutputRow = { daily_entry_id: string; content: string };
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function indiaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
const today = () => indiaDate();
const formatHours = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
function shiftDate(date: string, days: number) { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + days); return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }

export default async function DailyPage({ searchParams }: DailyPageProps) {
  const params = await searchParams;
  const date = params.date && datePattern.test(params.date) ? params.date : today();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { startDate, endDate } = monthBounds(new Date(`${date}T12:00:00`));
  const [tasksResult, entriesResult, monthEntriesResult, areasResult] = await Promise.all([
    supabase.from("tasks").select("id,name,category,priority,daily_target_minutes,completion_mode").eq("user_id", user.id).eq("is_active", true).order("priority"),
    supabase.from("daily_entries").select("id,task_id,focused_minutes,is_completed").eq("user_id", user.id).eq("entry_date", date),
    supabase.from("daily_entries").select("task_id,focused_minutes,is_completed,entry_date").eq("user_id", user.id).gte("entry_date", startDate).lte("entry_date", endDate),
    supabase.from("task_areas").select("name").eq("user_id", user.id).order("name"),
  ]);
  if (tasksResult.error || entriesResult.error || monthEntriesResult.error || areasResult.error) throw new Error("Unable to load daily tracking.");
  const entryIds = (entriesResult.data ?? []).map((entry) => entry.id);
  const { data: outputs, error: outputsError } = entryIds.length ? await supabase.from("daily_outputs").select("daily_entry_id,content").eq("user_id", user.id).in("daily_entry_id", entryIds) : { data: [], error: null };
  if (outputsError) throw new Error("Unable to load saved evidence.");
  const taskRows = (tasksResult.data ?? []) as TaskRow[];
  const entryRows = (entriesResult.data ?? []) as EntryRow[];
  const areas = (areasResult.data ?? []).map((area) => area.name);
  const scoreableTasks: ScoreableTask[] = taskRows.map((task) => ({ id: task.id, category: task.category, priority: task.priority, targetMinutes: task.daily_target_minutes, completionMode: task.completion_mode }));
  const dailyScore = calculateDailyScore(scoreableTasks, entryRows.map((entry) => ({ taskId: entry.task_id, focusedMinutes: entry.focused_minutes, isCompleted: entry.is_completed })));
  const evidenceByEntry = new Map(((outputs ?? []) as OutputRow[]).map((output) => [output.daily_entry_id, output.content]));
  const evidenceByTask = new Map(entryRows.map((entry) => [entry.task_id, evidenceByEntry.get(entry.id) ?? ""]));
  const monthSeries = buildProgressSeries(scoreableTasks, ((monthEntriesResult.data ?? []) as EntryRow[]).map((entry) => ({ taskId: entry.task_id, focusedMinutes: entry.focused_minutes, isCompleted: entry.is_completed, entryDate: entry.entry_date ?? date })), startDate, endDate);
  const isFuture = date > today();

  return <main className="mx-auto w-full max-w-6xl px-6 py-10"><header className="flex flex-wrap items-end justify-between gap-4"><div><Image alt="GRIND" className="h-auto w-50" height={68} priority src="/grind-logo.png" width={116} /><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Record focused work.</h1></div><nav className="flex flex-wrap items-center gap-2"><Link className="rounded-md border border-blue-500 px-3 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-950" href="/gym">Gym tracker</Link><Link className="rounded-md border border-orange-500 px-3 py-2 text-sm font-semibold text-orange-300 hover:bg-orange-950" href="/analytics">Analytics</Link><form action={signOut}><button className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600" type="submit">Log out</button></form></nav></header><div className="mt-8 flex flex-wrap items-center gap-3"><Link className="button-secondary px-3 py-2 text-sm" href={`/daily?date=${shiftDate(date, -1)}`}>Previous</Link><form><input aria-label="Entry date" className="field px-3 py-2 text-sm" defaultValue={date} max={today()} name="date" type="date" /><button className="button-orange ml-2 px-3 py-2 text-sm" type="submit">Go</button></form><Link className="button-secondary px-3 py-2 text-sm" href={`/daily?date=${shiftDate(date, 1)}`}>Next</Link>{isFuture ? <span className="rounded-full border border-orange-500 bg-orange-950 px-3 py-1 text-sm font-semibold text-orange-100">Future date — entries locked</span> : null}</div><section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Base score" value={`${dailyScore.basePoints} / ${dailyScore.maximumBasePoints}`} /><Metric label="Focused work" value={formatHours(dailyScore.focusedMinutes)} />{Object.entries(dailyScore.byCategory).map(([area, score]) => <Metric key={area} label={area} value={score.toString()} />)}</section><div className="mt-6 grid gap-4 lg:grid-cols-2"><TaskAreaManager areas={areas} /><TaskPlanManager areas={areas} tasks={taskRows.map((task) => ({ id: task.id, name: task.name, category: task.category, priority: task.priority, dailyTargetMinutes: task.daily_target_minutes }))} /></div><section className="mt-8 overflow-x-auto rounded-lg border border-zinc-700 bg-white"><table className="w-full min-w-[1024px] text-left text-sm"><thead className="bg-zinc-200 text-zinc-900"><tr><th className="px-4 py-3 font-semibold">Sl. no. / Priority</th><th className="px-4 py-3 font-semibold">Task</th><th className="px-4 py-3 font-semibold">Area</th><th className="px-4 py-3 font-semibold">Daily target</th><th className="px-4 py-3 font-semibold">Actual time spent</th><th className="px-4 py-3 font-semibold">Evidence / outcome</th><th className="px-4 py-3 font-semibold">Score</th></tr></thead><tbody>{dailyScore.taskScores.map((score) => <DailyTaskRow date={date} evidence={evidenceByTask.get(score.id) ?? ""} isFuture={isFuture} key={score.id} score={score} taskName={taskRows.find((task) => task.id === score.id)?.name ?? "Task"} />)}</tbody></table>{!dailyScore.taskScores.length ? <p className="p-8 text-zinc-600">Your daily task plan is being prepared. Apply the seed migration, then refresh.</p> : null}</section><div className="mt-5"><Link className="button-secondary inline-flex px-4 py-2.5 text-sm" href="/history">View recorded days</Link></div><div className="mt-10"><ProgressLineChart data={monthSeries} title="Current month progress" /></div><div className="mt-5"><Link className="button-secondary inline-flex px-4 py-2.5 text-sm" href="/analytics">View all monthly and yearly graphs</Link></div></main>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="panel rounded-lg p-4"><p className="text-sm text-zinc-400">{label}</p><p className="mt-1 text-xl font-semibold text-white">{value}</p></div>; }
