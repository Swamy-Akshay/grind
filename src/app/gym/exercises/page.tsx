import Link from "next/link";
import { ExercisePicker } from "@/components/gym/exercise-picker";
import { ExerciseManager } from "@/components/gym/exercise-manager";
import { GymPageGuide } from "@/components/gym/page-guide";
import { GymNav } from "@/components/gym/gym-nav";
import { createClient } from "@/lib/supabase/server";

export default async function ExercisePage({ searchParams }: { searchParams: Promise<{ date?: string; routine?: string }> }) {
  const p = await searchParams; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null;
  const { data } = await supabase.from("exercises").select("id,name,muscle_group,secondary_muscle_group,tracking_mode").eq("user_id", user.id).eq("is_active", true).order("muscle_group").order("name");
  const exercises = (data ?? []).map((exercise) => ({ id: exercise.id, name: exercise.name, muscleGroup: exercise.muscle_group, secondaryMuscleGroup: exercise.secondary_muscle_group, trackingMode: exercise.tracking_mode as "weight_reps" | "duration" }));
  const date = p.date ?? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return <main className="mx-auto w-full max-w-6xl px-6 py-10"><Link className="text-sm font-medium text-zinc-400 hover:text-white" href="/gym">← Back to workout</Link><h1 className="mt-7 text-3xl font-semibold text-white">Exercise library</h1><p className="mt-2 text-zinc-400">Filter by muscle group and select every exercise for this workout.</p><GymNav /><div className="mt-7"><ExercisePicker date={date} exercises={exercises} routine={p.routine} /></div><ExerciseManager exercises={exercises} /><GymPageGuide page="library" /></main>;
}
