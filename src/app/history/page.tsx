import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type TaskRow = { id: string; name: string; category: string; priority: number; daily_target_minutes: number };
type EntryRow = { id: string; task_id: string; entry_date: string; focused_minutes: number };
type OutputRow = { daily_entry_id: string; content: string };

const formatHours = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: tasks }, { data: entries, error: entriesError }] = await Promise.all([
    supabase.from("tasks").select("id,name,category,priority,daily_target_minutes").eq("user_id", user.id),
    supabase.from("daily_entries").select("id,task_id,entry_date,focused_minutes").eq("user_id", user.id).gt("focused_minutes", 0).order("entry_date", { ascending: false }),
  ]);
  if (entriesError) throw new Error("Unable to load recorded days.");
  const entryRows = (entries ?? []) as EntryRow[];
  const { data: outputs } = entryRows.length ? await supabase.from("daily_outputs").select("daily_entry_id,content").eq("user_id", user.id).in("daily_entry_id", entryRows.map((entry) => entry.id)) : { data: [] };
  const taskById = new Map(((tasks ?? []) as TaskRow[]).map((task) => [task.id, task]));
  const evidenceByEntry = new Map(((outputs ?? []) as OutputRow[]).map((output) => [output.daily_entry_id, output.content]));
  const grouped = Map.groupBy(entryRows, (entry) => entry.entry_date);

  return <main className="mx-auto w-full max-w-6xl px-6 py-10"><Link className="text-sm font-medium underline" href="/daily">← Daily progress</Link><p className="mt-8 text-sm font-semibold tracking-[0.2em] text-slate-500">RECORDED DAYS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Your saved daily tables.</h1><p className="mt-3 text-slate-600">This history shows only days with a saved focused-time entry.</p><div className="mt-8 space-y-8">{[...grouped.entries()].map(([date, dayEntries]) => <section key={date}><h2 className="mb-3 font-semibold text-slate-950">{date}</h2><div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">Task</th><th className="px-4 py-3">Area</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Focused time</th><th className="px-4 py-3">Witness / proof</th></tr></thead><tbody>{dayEntries.map((entry) => { const task = taskById.get(entry.task_id); return <tr className="border-t border-slate-200" key={entry.id}><td className="px-4 py-3 font-medium text-slate-950">{task?.name ?? "Deleted task"}</td><td className="px-4 py-3 capitalize text-slate-600">{task?.category ?? "—"}</td><td className="px-4 py-3 text-slate-600">{task?.priority ?? "—"}</td><td className="px-4 py-3 text-slate-600">{task ? formatHours(task.daily_target_minutes) : "—"}</td><td className="px-4 py-3 text-slate-600">{formatHours(entry.focused_minutes)}</td><td className="px-4 py-3 text-slate-600">{evidenceByEntry.get(entry.id) || "—"}</td></tr>; })}</tbody></table></div></section>)}</div>{!entryRows.length ? <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-slate-600">No daily entries have been saved yet.</div> : null}</main>;
}
