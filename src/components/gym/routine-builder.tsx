"use client";

import { Search } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { createRoutine, updateRoutine, type GymFormState } from "@/app/gym/actions";

const initial: GymFormState = {};
type Exercise = { id: string; name: string; muscleGroup: string };
type Routine = { id: string; name: string; exerciseIds: string[] };

export function RoutineBuilder({ exercises, routine }: { exercises: Exercise[]; routine?: Routine }) {
  const [name, setName] = useState(routine?.name ?? "");
  const [selected, setSelected] = useState<string[]>(routine?.exerciseIds ?? []);
  const [group, setGroup] = useState("All");
  const [query, setQuery] = useState("");
  const [state, action, pending] = useActionState(routine ? updateRoutine : createRoutine, initial);
  const payload = useMemo(() => JSON.stringify(selected), [selected]);
  const groups = ["All", ...new Set(exercises.map((exercise) => exercise.muscleGroup))];
  const shown = exercises.filter((exercise) => (group === "All" || exercise.muscleGroup === group) && exercise.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <form action={action} className="panel rounded-xl p-5"><input name="routineId" type="hidden" value={routine?.id ?? ""} /><input name="exerciseIds" type="hidden" value={payload} /><label className="block max-w-sm text-sm text-zinc-300">Routine name<input className="field mt-1 px-3 py-2" name="name" onChange={(event) => setName(event.target.value)} value={name} /></label><div className="mt-5 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} /><input aria-label="Search exercises" className="field w-full py-2 pl-10 pr-3" onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises" value={query} /></label><select aria-label="Muscle group" className="field w-full px-3 py-2 sm:w-56" onChange={(event) => setGroup(event.target.value)} value={group}>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><p className="mt-3 text-sm text-zinc-400">{shown.length} matching exercise{shown.length === 1 ? "" : "s"} · {selected.length} selected</p><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{shown.map((exercise) => <label className="flex items-center gap-2 rounded border border-zinc-700 p-3 text-sm text-zinc-200" key={exercise.id}><input checked={selected.includes(exercise.id)} onChange={() => setSelected((current) => current.includes(exercise.id) ? current.filter((id) => id !== exercise.id) : [...current, exercise.id])} type="checkbox" />{exercise.name}<span className="ml-auto text-xs text-zinc-500">{exercise.muscleGroup}</span></label>)}</div>{!shown.length ? <p className="mt-4 text-sm text-zinc-500">No exercises match this muscle group and search text.</p> : null}<button className="button-orange mt-5 px-4 py-2 font-semibold disabled:opacity-60" disabled={pending || !name || !selected.length}>{routine ? "Save routine changes" : "Save routine"}</button>{state.error ? <p className="mt-2 text-sm text-red-300">{state.error}</p> : null}{state.message ? <p className="mt-2 text-sm text-green-300">{state.message}</p> : null}</form>;
}
