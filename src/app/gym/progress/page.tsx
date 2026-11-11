import Link from "next/link";
import { GymNav } from "@/components/gym/gym-nav";
import { GymPageGuide } from "@/components/gym/page-guide";
import { WorkoutVolumeChart } from "@/components/gym/workout-volume-chart";
import { buildMonthlyWorkoutSeries, buildYearlyWorkoutSeries, type WorkoutProgressInput } from "@/lib/analytics/gym-progress";
import { createClient } from "@/lib/supabase/server";

export default async function GymProgressPage() {
  const now = new Date();
  const year = now.getFullYear();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("workouts").select("performed_on,workout_sets(weight_kg,reps)").eq("user_id", user.id).gte("performed_on", `${year}-01-01`).lte("performed_on", `${year}-12-31`);
  const workouts: WorkoutProgressInput[] = (data ?? []).map((workout) => ({ performedOn: workout.performed_on, setCount: workout.workout_sets.length, volumeKg: workout.workout_sets.reduce((total, set) => total + Number(set.weight_kg ?? 0) * Number(set.reps ?? 0), 0) }));
  const monthKeys = [...new Set(workouts.map((workout) => workout.performedOn.slice(0, 7)))];
  const label = (key: string) => new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${key}-01T12:00:00`));

  return <main className="mx-auto w-full max-w-6xl px-6 py-10"><Link className="text-sm font-medium text-zinc-400 hover:text-white" href="/gym">← Back to workout</Link><h1 className="mt-7 text-3xl font-semibold text-white">Training progress</h1><p className="mt-2 text-zinc-400">Monthly charts show every Monday–Saturday date. The yearly chart has 52 weekly points grouped chronologically by month; volume is only calculated from recorded sets.</p><GymNav />{monthKeys.length ? <div className="mt-7 space-y-7">{monthKeys.map((key) => { const [monthYear, month] = key.split("-").map(Number); return <WorkoutVolumeChart data={buildMonthlyWorkoutSeries(workouts.filter((workout) => workout.performedOn.startsWith(key)), monthYear, month - 1)} key={key} title={`${label(key)} volume`} />; })}</div> : <p className="panel mt-7 rounded-xl p-8 text-zinc-400">No recorded workouts this year yet.</p>}<div className="mt-7"><WorkoutVolumeChart data={buildYearlyWorkoutSeries(workouts, year)} title={`${year} weekly volume`} /></div><GymPageGuide page="progress" /></main>;
}
