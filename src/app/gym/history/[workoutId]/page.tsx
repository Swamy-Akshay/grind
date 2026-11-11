import Link from "next/link";
import { WorkoutLogger, type DraftSet } from "@/components/gym/workout-logger";
import { createClient } from "@/lib/supabase/server";

type Exercise = { id: string; name: string; tracking_mode: "weight_reps" | "duration" };
type SetRow = { set_number: number; weight_kg: number | null; reps: number | null; duration_seconds: number | null; rir: number | null; set_type: "warmup" | "working" | null; exercises: Exercise | Exercise[] | null };

function oneExercise(relation: SetRow["exercises"]): Exercise | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export default async function EditWorkoutPage({ params }: { params: Promise<{ workoutId: string }> }) {
  const { workoutId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: workout } = await supabase.from("workouts").select("id,performed_on,template_id,workout_sets(set_number,weight_kg,reps,duration_seconds,rir,set_type,exercises(id,name,tracking_mode))").eq("id", workoutId).eq("user_id", user.id).single();
  if (!workout) return <main className="p-10 text-white">Workout not found.</main>;

  const rows = workout.workout_sets as unknown as SetRow[];
  const exercises = [...new Map(rows.flatMap((row) => {
    const exercise = oneExercise(row.exercises);
    return exercise ? [[exercise.id, { exerciseId: exercise.id, name: exercise.name, trackingMode: exercise.tracking_mode }]] : [];
  })).values()];
  const initialSets: DraftSet[] = rows.flatMap((row) => {
    const exercise = oneExercise(row.exercises);
    return exercise ? [{
      exerciseId: exercise.id,
      setNumber: row.set_number,
      trackingMode: exercise.tracking_mode,
      weightKg: row.weight_kg === null ? "" : String(row.weight_kg),
      reps: row.reps === null ? "" : String(row.reps),
      duration: row.duration_seconds === null ? "" : `${Math.floor(row.duration_seconds / 60)}:${String(row.duration_seconds % 60).padStart(2, "0")}`,
      rir: row.rir === null ? "" : String(row.rir),
      setType: row.set_type,
    }] : [];
  });

  return <main className="mx-auto w-full max-w-5xl px-6 py-10"><Link className="button-secondary inline-flex px-3 py-2 text-sm" href="/gym/history">Back to history</Link><h1 className="mt-7 text-3xl font-semibold text-white">Edit workout · {workout.performed_on}</h1><div className="mt-7"><WorkoutLogger date={workout.performed_on} exercises={exercises} initialSets={initialSets} templateId={workout.template_id ?? undefined} workoutId={workout.id} /></div></main>;
}
