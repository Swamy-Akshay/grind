import Link from "next/link";
import { Dumbbell, Plus } from "lucide-react";
import { GymNav } from "@/components/gym/gym-nav";
import { GymPageGuide } from "@/components/gym/page-guide";
import { WorkoutLogger, type DraftSet } from "@/components/gym/workout-logger";
import { WorkoutVolumeChart } from "@/components/gym/workout-volume-chart";
import { buildWorkoutProgressSeries } from "@/lib/analytics/gym-progress";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ date?: string; routine?: string; add?: string }> };
type ExerciseRelation = { id: string; name: string; tracking_mode: "weight_reps" | "duration" } | { id: string; name: string; tracking_mode: "weight_reps" | "duration" }[] | null;
type SetRow = { exercise_id: string; set_number: number; weight_kg: number | null; reps: number | null; duration_seconds: number | null; exercises: ExerciseRelation };
const pattern = /^\d{4}-\d{2}-\d{2}$/;
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const shift = (input: string, days: number) => { const value = new Date(`${input}T12:00:00`); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); };
const one = (relation: ExerciseRelation) => Array.isArray(relation) ? relation[0] ?? null : relation;

export default async function GymPage({ searchParams }: Props) {
  const p = await searchParams; const date = p.date && pattern.test(p.date) ? p.date : today();
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null;
  const [{ data: routines }, { data: weekly }, { data: dayWorkouts }, { data: priorWorkouts }] = await Promise.all([
    supabase.from("workout_templates").select("id,name").eq("user_id", user.id).eq("is_active", true).order("position"),
    supabase.from("workouts").select("performed_on,workout_sets(weight_kg,reps)").eq("user_id", user.id).gte("performed_on", shift(date, -6)).lte("performed_on", date),
    supabase.from("workouts").select("id,template_id,completed_at,workout_sets(exercise_id,set_number,weight_kg,reps,duration_seconds,exercises(id,name,tracking_mode))").eq("user_id", user.id).eq("performed_on", date).order("completed_at", { ascending: false }).limit(1),
    supabase.from("workouts").select("workout_sets(exercise_id,weight_kg)").eq("user_id", user.id).lt("performed_on", date),
  ]);
  const saved = dayWorkouts?.[0]; const savedSets = (saved?.workout_sets ?? []) as unknown as SetRow[];
  const routine = (routines ?? []).find((item) => item.id === p.routine);
  const { data: routineRows } = routine ? await supabase.from("workout_template_exercises").select("exercises(id,name,tracking_mode)").eq("template_id", routine.id).order("position") : { data: [] };
  const ids = p.add?.split(",").filter(Boolean) ?? [];
  const { data: addedRows } = ids.length ? await supabase.from("exercises").select("id,name,tracking_mode").eq("user_id", user.id).in("id", ids) : { data: [] };
  const addedById = new Map((addedRows ?? []).map((item) => [item.id, item]));
  const fromRoutine = (routineRows ?? []).flatMap((row) => { const item = Array.isArray(row.exercises) ? row.exercises[0] : row.exercises; return item ? [{ exerciseId: item.id, name: item.name, trackingMode: item.tracking_mode as "weight_reps" | "duration" }] : []; });
  const fromSaved = savedSets.flatMap((set) => { const item = one(set.exercises); return item ? [{ exerciseId: item.id, name: item.name, trackingMode: item.tracking_mode }] : []; });
  const selected = ids.flatMap((id) => { const item = addedById.get(id); return item ? [{ exerciseId: item.id, name: item.name, trackingMode: item.tracking_mode as "weight_reps" | "duration" }] : []; });
  const exercises = [...fromSaved, ...fromRoutine, ...selected].filter((item, index, all) => all.findIndex((other) => other.exerciseId === item.exerciseId) === index);
  const initialSets: DraftSet[] = savedSets.flatMap((set) => { const exercise = one(set.exercises); return exercise ? [{ exerciseId: exercise.id, setNumber: set.set_number, trackingMode: exercise.tracking_mode, weightKg: String(set.weight_kg ?? 0), reps: String(set.reps ?? 0), duration: set.duration_seconds === null ? "" : `${Math.floor(set.duration_seconds / 60)}:${String(set.duration_seconds % 60).padStart(2, "0")}` }] : []; });
  const series = buildWorkoutProgressSeries((weekly ?? []).map((workout) => ({ performedOn: workout.performed_on, setCount: workout.workout_sets.length, volumeKg: workout.workout_sets.reduce((sum, set) => sum + Number(set.weight_kg ?? 0) * Number(set.reps ?? 0), 0) })));
  const volume = savedSets.reduce((sum, set) => sum + Number(set.weight_kg ?? 0) * Number(set.reps ?? 0), 0);
  const priorMax = new Map<string, number>(); for (const workout of priorWorkouts ?? []) for (const set of workout.workout_sets) priorMax.set(set.exercise_id, Math.max(priorMax.get(set.exercise_id) ?? -Infinity, Number(set.weight_kg ?? -Infinity)));
  const todayMax = new Map<string, number>(); for (const set of savedSets) todayMax.set(set.exercise_id, Math.max(todayMax.get(set.exercise_id) ?? -Infinity, Number(set.weight_kg ?? -Infinity)));
  const prCount = [...todayMax].filter(([exerciseId, weight]) => Number.isFinite(weight) && weight > (priorMax.get(exerciseId) ?? -Infinity)).length;
  const dateControls = <div className="flex items-center gap-2"><Link aria-label="Previous day" className="text-sm text-zinc-400 hover:text-white" href={`/gym?date=${shift(date, -1)}`}>←</Link><form className="flex items-center gap-2"><input aria-label="Workout date" className="field w-auto px-2 py-1.5 text-sm" defaultValue={date} max={today()} name="date" type="date" /><button className="button-orange px-2 py-1.5 text-sm">Go</button></form><Link aria-label="Next day" className="text-sm text-zinc-400 hover:text-white" href={`/gym?date=${shift(date, 1)}`}>→</Link></div>;
  return <main className="mx-auto w-full max-w-6xl px-6 py-10"><header><p className="text-sm font-semibold tracking-[0.2em] text-green-400">GYM / PERFORMANCE</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-white"><Dumbbell className="text-orange-400" /> Current day workout</h1><GymNav rightSlot={dateControls} /></header><div className="mt-6 flex flex-wrap items-center gap-3"><Link className="button-secondary inline-flex items-center gap-2 px-3 py-2" href={`/gym/exercises?date=${date}${routine ? `&routine=${routine.id}` : ""}`}><Plus size={16} /> Add exercise</Link><Link className="button-orange px-3 py-2" href={`/gym/routines?date=${date}`}>Select a routine</Link><div className="ml-auto flex gap-5 text-right"><p><span className="block text-xs uppercase tracking-wide text-zinc-500">Day volume</span><span className="font-semibold text-green-300">{volume.toLocaleString()} kg</span></p><p><span className="block text-xs uppercase tracking-wide text-zinc-500">New PRs</span><span className="font-semibold text-orange-300">{prCount}</span></p></div></div>{exercises.length ? <div className="mt-6"><WorkoutLogger date={date} exercises={exercises} initialSets={initialSets} templateId={routine?.id ?? saved?.template_id ?? undefined} workoutId={saved?.id} /></div> : <section className="panel mt-6 rounded-xl p-6 text-zinc-300">Select a routine or add exercises to begin this workout.</section>}<div className="mt-8"><WorkoutVolumeChart data={series} title="This week’s training volume" /></div><GymPageGuide page="today" /></main>;
}
