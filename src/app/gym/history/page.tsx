import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteWorkout } from "@/app/gym/actions";
import { GymNav } from "@/components/gym/gym-nav";
import { createClient } from "@/lib/supabase/server";

type Exercise = { name: string };
type SetRow = { id: string; set_number: number; weight_kg: number | null; reps: number | null; duration_seconds: number | null; exercises: Exercise | Exercise[] | null };
type Workout = { id: string; performed_on: string; workout_sets: SetRow[] };
const oneExercise = (relation: SetRow["exercises"]) => Array.isArray(relation) ? relation[0] ?? null : relation;
const displaySet = (set: SetRow) => set.duration_seconds === null ? `${set.weight_kg} kg × ${set.reps} reps` : `${Math.floor(set.duration_seconds / 60)}:${String(set.duration_seconds % 60).padStart(2, "0")}`;

export default async function GymHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("workouts").select("id,performed_on,workout_sets(id,set_number,weight_kg,reps,duration_seconds,exercises(name))").eq("user_id", user.id).order("performed_on", { ascending: false }).limit(100);
  const workouts = (data ?? []) as unknown as Workout[];

  return <main className="mx-auto w-full max-w-5xl px-6 py-10"><Link className="button-secondary inline-flex px-3 py-2 text-sm" href="/gym">Back to workout</Link><h1 className="mt-7 text-3xl font-semibold text-white">Workout history</h1><p className="mt-2 text-zinc-400">Each session shows its exercises and saved sets. Open a session to edit it, or delete it permanently.</p><GymNav /><div className="mt-7 space-y-4">{workouts.map((workout) => {
    const byExercise = new Map<string, { name: string; sets: SetRow[] }>();
    for (const set of workout.workout_sets) {
      const exercise = oneExercise(set.exercises);
      const name = exercise?.name ?? "Unknown exercise";
      const group = byExercise.get(name) ?? { name, sets: [] };
      group.sets.push(set);
      byExercise.set(name, group);
    }
    return <section className="gym-exercise-card rounded-xl p-5" key={workout.id}><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold tracking-wider text-zinc-400">{workout.performed_on}</p><h2 className="mt-1 font-semibold text-white">{byExercise.size} exercise{byExercise.size === 1 ? "" : "s"} · {workout.workout_sets.length} sets</h2></div><div className="flex gap-2"><Link className="button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm" href={`/gym/history/${workout.id}`}><Pencil size={15} /> Edit</Link><form action={deleteWorkout}><input name="workoutId" type="hidden" value={workout.id} /><button aria-label={`Delete workout on ${workout.performed_on}`} className="rounded-md bg-red-950 px-3 py-2 text-red-200 hover:bg-red-900"><Trash2 size={16} /></button></form></div></div><div className="mt-5 space-y-4">{[...byExercise.values()].map((group) => <div className="border-t border-zinc-700 pt-3" key={group.name}><h3 className="font-medium text-white">{group.name}</h3><div className="mt-2 space-y-1">{group.sets.sort((a, b) => a.set_number - b.set_number).map((set) => <div className="flex text-sm" key={set.id}><span className="w-16 text-zinc-400">Set {set.set_number}</span><span className="text-zinc-200">{displaySet(set)}</span></div>)}</div></div>)}</div></section>;
  })}{!workouts.length ? <p className="panel rounded-xl p-8 text-zinc-400">No completed workout sessions yet.</p> : null}</div></main>;
}
