"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

type Exercise = { id: string; name: string; muscleGroup: string; trackingMode: string };

export function ExercisePicker({ exercises, date, routine }: { exercises: Exercise[]; date: string; routine?: string }) {
  const [group, setGroup] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const groups = ["All", ...new Set(exercises.map((exercise) => exercise.muscleGroup))];
  const shown = useMemo(() => exercises.filter((exercise) => (group === "All" || exercise.muscleGroup === group) && exercise.name.toLowerCase().includes(query.trim().toLowerCase())), [exercises, group, query]);
  const href = `/gym?date=${date}${routine ? `&routine=${routine}` : ""}&add=${selected.join(",")}`;

  return <><div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} /><input aria-label="Search exercises" className="field w-full py-2 pl-10 pr-3" onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises" value={query} /></label><select aria-label="Muscle group" className="field w-full px-3 py-2 sm:w-56" onChange={(event) => setGroup(event.target.value)} value={group}>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><p className="mt-3 text-sm text-zinc-400">{shown.length} matching exercise{shown.length === 1 ? "" : "s"}</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shown.map((exercise) => <label className="panel flex cursor-pointer items-center justify-between rounded-lg p-4" key={exercise.id}><span><span className="block font-medium text-white">{exercise.name}</span><span className="mt-1 block text-xs text-zinc-400">{exercise.muscleGroup} · {exercise.trackingMode === "duration" ? "mm:ss" : "kg + reps"}</span></span><input checked={selected.includes(exercise.id)} className="h-4 w-4 accent-orange-500" onChange={() => setSelected((current) => current.includes(exercise.id) ? current.filter((id) => id !== exercise.id) : [...current, exercise.id])} type="checkbox" /></label>)}</div>{!shown.length ? <p className="panel mt-4 rounded-lg p-4 text-sm text-zinc-400">No exercises match this muscle group and search text.</p> : null}<div className="mt-6"><Link className={`button-orange inline-flex px-4 py-2 font-semibold ${selected.length ? "" : "pointer-events-none opacity-50"}`} href={href}>Add {selected.length} exercise{selected.length === 1 ? "" : "s"} to workout</Link></div></>;
}
