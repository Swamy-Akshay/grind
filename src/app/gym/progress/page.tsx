import Link from "next/link";
import { GymNav } from "@/components/gym/gym-nav";
import { GymPageGuide } from "@/components/gym/page-guide";
import { GymProgressDashboard } from "@/components/gym/gym-progress-dashboard";
import { WorkoutVolumeChart } from "@/components/gym/workout-volume-chart";
import { buildMonthlyWorkoutSeries, buildYearlyWorkoutSeries, type ExerciseSetRecord, type TrainingSchedule, type WorkoutProgressInput } from "@/lib/analytics/gym-progress";
import { createClient } from "@/lib/supabase/server";

type ExerciseRelation = { id: string; name: string; muscle_group: string; secondary_muscle_group: string | null; tracking_mode: "weight_reps" | "duration" } | { id: string; name: string; muscle_group: string; secondary_muscle_group: string | null; tracking_mode: "weight_reps" | "duration" }[] | null;
type SetRow = { exercise_id: string; set_number: number; weight_kg: number | null; reps: number | null; duration_seconds: number | null; set_type: "warmup" | "working" | null; exercises: ExerciseRelation };
type HistoricalWorkout = { id: string; performed_on: string; workout_sets: SetRow[] };
const one = (relation: ExerciseRelation) => Array.isArray(relation) ? relation[0] ?? null : relation;
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

export default async function GymProgressPage() {
  const now = new Date(); const year = now.getFullYear(); const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return null;
  const [{ data: volumeData, error: volumeError }, { data: historyData, error: historyError }, { data: scheduleData, error: scheduleError }] = await Promise.all([
    supabase.from("workouts").select("performed_on,workout_sets(weight_kg,reps)").eq("user_id", user.id).gte("performed_on", `${year}-01-01`).lte("performed_on", `${year}-12-31`).order("performed_on"),
    supabase.from("workouts").select("id,performed_on,workout_sets(exercise_id,set_number,weight_kg,reps,duration_seconds,set_type,exercises(id,name,muscle_group,secondary_muscle_group,tracking_mode))").eq("user_id", user.id).order("performed_on"),
    supabase.from("training_schedules").select("effective_on,planned_weekdays").eq("user_id", user.id).order("effective_on"),
  ]);
  const workouts: WorkoutProgressInput[] = (volumeData ?? []).map((workout) => ({ performedOn: workout.performed_on, setCount: workout.workout_sets.length, volumeKg: workout.workout_sets.reduce((total, set) => total + Number(set.weight_kg ?? 0) * Number(set.reps ?? 0), 0) }));
  const records: ExerciseSetRecord[] = ((historyData ?? []) as unknown as HistoricalWorkout[]).flatMap((workout) => workout.workout_sets.flatMap((set) => { const exercise = one(set.exercises); return exercise ? [{ workoutId: workout.id, performedOn: workout.performed_on, exercise: { id: exercise.id, name: exercise.name, muscleGroup: exercise.muscle_group, secondaryMuscleGroup: exercise.secondary_muscle_group, trackingMode: exercise.tracking_mode }, setNumber: set.set_number, weightKg: set.weight_kg, reps: set.reps, durationSeconds: set.duration_seconds, setType: set.set_type }] : []; }));
  const schedules: TrainingSchedule[] = (scheduleData ?? []).map((schedule) => ({ effectiveOn: schedule.effective_on, plannedWeekdays: schedule.planned_weekdays.map(Number) }));
  const monthKeys = [...new Set(workouts.map((workout) => workout.performedOn.slice(0, 7)))].sort();
  const label = (key: string) => new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${key}-01T12:00:00`));
  const queryError = volumeError || historyError || scheduleError;
  return <main className="mx-auto w-full max-w-6xl px-6 py-10"><Link className="text-sm font-medium text-zinc-400 hover:text-white" href="/gym">← Back to workout</Link><h1 className="mt-7 text-3xl font-semibold text-white">Training progress</h1><p className="mt-2 text-zinc-400">Exercise trends use comparable recorded sets. Volume remains a secondary training statistic.</p><GymNav />{queryError ? <p className="panel mt-7 rounded-xl p-5 text-red-200">Some progress information could not be loaded. Apply the latest Gym migration, then refresh this page.</p> : <GymProgressDashboard records={records} schedules={schedules} today={today()} />}{monthKeys.length ? <div className="mt-7 space-y-7">{monthKeys.map((key) => { const [monthYear, month] = key.split("-").map(Number); return <WorkoutVolumeChart data={buildMonthlyWorkoutSeries(workouts.filter((workout) => workout.performedOn.startsWith(key)), monthYear, month - 1)} key={key} title={`${label(key)} Total Resistance Volume Load`} />; })}</div> : <p className="panel mt-7 rounded-xl p-8 text-zinc-400">No recorded workouts this year yet.</p>}<div className="mt-7"><WorkoutVolumeChart data={buildYearlyWorkoutSeries(workouts, year)} title={`${year} Total Resistance Volume Load`} xAxisKey="axisLabel" /></div><GymPageGuide page="progress" /></main>;
}
