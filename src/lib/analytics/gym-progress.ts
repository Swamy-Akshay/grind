export type WorkoutProgressInput = { performedOn: string; setCount: number; volumeKg: number };
export type WorkoutProgressPoint = { date: string; label: string; workouts: number; sets: number; volumeKg: number };

export function buildWorkoutProgressSeries(workouts: WorkoutProgressInput[]): WorkoutProgressPoint[] {
  const byDate = new Map<string, WorkoutProgressPoint>();
  for (const workout of workouts) {
    const current = byDate.get(workout.performedOn) ?? { date: workout.performedOn, label: workout.performedOn.slice(5), workouts: 0, sets: 0, volumeKg: 0 };
    current.workouts += 1;
    current.sets += workout.setCount;
    current.volumeKg += workout.volumeKg;
    byDate.set(workout.performedOn, current);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).map((point) => ({ ...point, volumeKg: Math.round(point.volumeKg * 100) / 100 }));
}

export function estimatedOneRepMax(weightKg: number, reps: number) {
  if (weightKg < 0 || reps < 1) throw new Error("Weight and reps must be positive.");
  return Math.round(weightKg * (1 + reps / 30) * 100) / 100;
}
