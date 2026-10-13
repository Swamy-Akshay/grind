"use client";

import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { saveTaskPlan, type DailyFormState } from "@/app/daily/actions";
import { focusedTimeToMinutes, minutesToFocusedTime } from "@/lib/utils/focused-time";

export type ManagedTask = {
  id: string;
  name: string;
  category: string;
  priority: number;
  dailyTargetMinutes: number;
  completionMode?: "focused_time" | "checkbox";
};

const initialState: DailyFormState = {};

export function TaskPlanManager({ areas, tasks }: { areas: string[]; tasks: ManagedTask[] }) {
  const [plan, setPlan] = useState(() => [...tasks].sort((a, b) => a.priority - b.priority));
  const [state, formAction, pending] = useActionState(saveTaskPlan, initialState);
  const payload = useMemo(
    () => JSON.stringify(plan.map((task, index) => ({ ...task, priority: index + 1, completionMode: task.completionMode ?? "focused_time" }))),
    [plan],
  );

  function update(index: number, patch: Partial<ManagedTask>) {
    setPlan((current) => current.map((task, taskIndex) => taskIndex === index ? { ...task, ...patch } : task));
  }

  function remove(index: number) {
    if (plan.length > 1) setPlan((current) => current.filter((_, taskIndex) => taskIndex !== index));
  }

  function add() {
    setPlan((current) => [...current, {
      id: "",
      name: "New task",
      category: areas[0] ?? "Career",
      priority: current.length + 1,
      dailyTargetMinutes: 30,
      completionMode: "focused_time",
    }]);
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= plan.length) return;
    setPlan((current) => {
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  }

  return (
    <details className="panel rounded-xl">
      <summary className="cursor-pointer px-5 py-4 font-semibold text-white">Manage daily task plan</summary>
      <form action={formAction} className="border-t border-zinc-700 p-5">
        <input name="plan" type="hidden" value={payload} />
        <div className="space-y-3">
          {plan.map((task, index) => (
            <div className="grid gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 p-3 sm:grid-cols-[3rem_auto_1fr_9rem_8rem_8rem_auto]" key={task.id || `new-${index}`}>
              <span className="self-center text-center font-semibold text-zinc-300">{index + 1}</span>
              <div className="flex gap-1">
                <button aria-label={`Move ${task.name} up`} className="rounded p-1 text-blue-400 hover:bg-blue-950 disabled:text-zinc-600" disabled={index === 0} onClick={() => move(index, -1)} type="button"><ArrowUp size={16} /></button>
                <button aria-label={`Move ${task.name} down`} className="rounded p-1 text-blue-400 hover:bg-blue-950 disabled:text-zinc-600" disabled={index === plan.length - 1} onClick={() => move(index, 1)} type="button"><ArrowDown size={16} /></button>
              </div>
              <input aria-label={`Task ${index + 1} name`} className="field px-2 py-1.5" onChange={(event) => update(index, { name: event.target.value })} value={task.name} />
              <select aria-label={`${task.name} area`} className="field px-2 py-1.5" onChange={(event) => update(index, { category: event.target.value })} value={task.category}>
                {areas.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
              <select aria-label={`${task.name} evaluation factor`} className="field px-2 py-1.5" onChange={(event) => update(index, { completionMode: event.target.value as ManagedTask["completionMode"] })} value={task.completionMode ?? "focused_time"}><option value="focused_time">Time</option><option value="checkbox">Tick box</option></select>
              <input aria-label={`${task.name} daily target`} className="field px-2 py-1.5" defaultValue={minutesToFocusedTime(task.dailyTargetMinutes)} onBlur={(event) => { try { update(index, { dailyTargetMinutes: focusedTimeToMinutes(event.target.value) }); } catch { event.currentTarget.value = minutesToFocusedTime(task.dailyTargetMinutes); } }} placeholder="HH:MM" type="text" />
              <button aria-label={`Delete ${task.name}`} className="justify-self-start rounded p-2 text-red-400 hover:bg-red-950 disabled:text-zinc-600" disabled={plan.length === 1} onClick={() => remove(index)} type="button"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-md border border-blue-500 bg-zinc-950 px-3 py-2 text-sm font-medium text-blue-300 hover:bg-blue-950" onClick={add} type="button"><Plus size={16} /> Add task</button>
          <button className="button-orange inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-60" disabled={pending} type="submit"><Save size={16} /> {pending ? "Saving..." : "Save task plan"}</button>
          {state.error ? <p aria-live="polite" className="text-sm text-red-300">{state.error}</p> : null}
          {state.message ? <p aria-live="polite" className="text-sm text-green-300">{state.message}</p> : null}
        </div>
        <p className="mt-3 text-xs text-zinc-400">The first task earns the most points; each following task earns one fewer. Task numbers always stay continuous.</p>
      </form>
    </details>
  );
}
