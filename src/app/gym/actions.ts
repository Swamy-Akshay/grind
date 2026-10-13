"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { workoutSubmissionSchema } from "@/lib/validation/gym";

export type GymFormState = { error?: string; message?: string };

export async function deleteWorkout(formData: FormData) {
  const workoutId = formData.get("workoutId");
  if (typeof workoutId !== "string") return;
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("workouts").delete().eq("id", workoutId).eq("user_id", user.id);
  revalidatePath("/gym"); revalidatePath("/gym/history"); revalidatePath("/gym/progress");
}

export async function deleteRoutine(formData: FormData) {
  const routineId = formData.get("routineId"); if (typeof routineId !== "string") return;
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
  await supabase.from("workout_templates").delete().eq("id", routineId).eq("user_id", user.id);
  revalidatePath("/gym/routines"); revalidatePath("/gym");
}

export async function createRoutine(_: GymFormState, formData: FormData): Promise<GymFormState> {
  const name = String(formData.get("name") ?? "").trim(); const raw = formData.get("exerciseIds");
  if (!name || name.length > 80 || typeof raw !== "string") return { error: "Enter a routine name and select exercises." };
  let exerciseIds: unknown; try { exerciseIds = JSON.parse(raw); } catch { return { error: "Exercises could not be read." }; }
  if (!Array.isArray(exerciseIds) || !exerciseIds.length || exerciseIds.some((id) => typeof id !== "string")) return { error: "Select at least one exercise." };
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: "Please sign in again." };
  const { data: exercises } = await supabase.from("exercises").select("id,recommended_sets").eq("user_id", user.id).in("id", exerciseIds);
  if (!exercises || exercises.length !== exerciseIds.length) return { error: "One or more exercises are unavailable." };
  const { data: routine, error } = await supabase.from("workout_templates").insert({ user_id: user.id, name, split_day: "Custom", position: 20 }).select("id").single();
  if (error || !routine) return { error: "Unable to create routine. Use a unique name." };
  const targets = new Map(exercises.map((exercise) => [exercise.id, exercise.recommended_sets]));
  const { error: joinError } = await supabase.from("workout_template_exercises").insert(exerciseIds.map((id, index) => ({ user_id: user.id, template_id: routine.id, exercise_id: id, position: index + 1, target_sets: targets.get(id) ?? 3 })));
  if (joinError) { await supabase.from("workout_templates").delete().eq("id", routine.id); return { error: "Unable to save routine exercises." }; }
  revalidatePath("/gym/routines"); revalidatePath("/gym"); return { message: "Routine saved." };
}

export async function updateRoutine(_: GymFormState, formData: FormData): Promise<GymFormState> {
  const routineId = formData.get("routineId"); const name = String(formData.get("name") ?? "").trim(); const raw = formData.get("exerciseIds");
  if (typeof routineId !== "string" || !name || typeof raw !== "string") return { error: "Enter a routine name and select exercises." };
  let ids: unknown; try { ids = JSON.parse(raw); } catch { return { error: "Exercises could not be read." }; }
  if (!Array.isArray(ids) || !ids.length || ids.some((id) => typeof id !== "string")) return { error: "Select at least one exercise." };
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: "Please sign in again." };
  const { data: routine } = await supabase.from("workout_templates").update({ name }).eq("id", routineId).eq("user_id", user.id).select("id").single(); if (!routine) return { error: "Routine not found or name is already used." };
  const { data: exercises } = await supabase.from("exercises").select("id,recommended_sets").eq("user_id", user.id).in("id", ids); if (!exercises || exercises.length !== ids.length) return { error: "One or more exercises are unavailable." };
  const { error: clearError } = await supabase.from("workout_template_exercises").delete().eq("template_id", routine.id).eq("user_id", user.id); if (clearError) return { error: "Unable to update routine." };
  const targets = new Map(exercises.map((exercise) => [exercise.id, exercise.recommended_sets]));
  const { error } = await supabase.from("workout_template_exercises").insert(ids.map((id, index) => ({ user_id: user.id, template_id: routine.id, exercise_id: id, position: index + 1, target_sets: targets.get(id) ?? 3 })));
  if (error) return { error: "Unable to save routine exercises." }; revalidatePath("/gym/routines"); revalidatePath("/gym"); return { message: "Routine updated." };
}

export async function saveExercise(_: GymFormState, formData: FormData): Promise<GymFormState> {
  const id = formData.get("id"); const name = String(formData.get("name") ?? "").trim(); const muscleGroup = String(formData.get("muscleGroup") ?? "").trim(); const mode = formData.get("trackingMode");
  if (!name || !muscleGroup || (mode !== "weight_reps" && mode !== "duration")) return { error: "Enter an exercise name, muscle group, and input type." };
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: "Please sign in again." };
  const values = { name, muscle_group: muscleGroup, tracking_mode: mode };
  const result = typeof id === "string" && id ? await supabase.from("exercises").update(values).eq("id", id).eq("user_id", user.id) : await supabase.from("exercises").insert({ ...values, user_id: user.id });
  if (result.error) return { error: "Unable to save exercise. Names must be unique." }; revalidatePath("/gym/exercises"); revalidatePath("/gym/routines"); return { message: "Exercise saved." };
}

export async function deleteExercise(formData: FormData) { const id = formData.get("exerciseId"); if (typeof id !== "string") return; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { error } = await supabase.from("exercises").delete().eq("id", id).eq("user_id", user.id); if (error) return; revalidatePath("/gym/exercises"); revalidatePath("/gym/routines"); }

export async function saveWorkout(_: GymFormState, formData: FormData): Promise<GymFormState> {
  const rawSets = formData.get("sets");
  if (typeof rawSets !== "string") return { error: "Workout sets are missing." };
  let sets: unknown;
  try { sets = JSON.parse(rawSets); } catch { return { error: "Workout sets could not be read." }; }
  const templateId = formData.get("templateId"); const workoutId = formData.get("workoutId");
  const parsed = workoutSubmissionSchema.safeParse({ templateId: typeof templateId === "string" && templateId ? templateId : null, performedOn: formData.get("performedOn"), notes: formData.get("notes") ?? "", sets });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the workout values." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  if (parsed.data.templateId) { const { data: template } = await supabase.from("workout_templates").select("id").eq("id", parsed.data.templateId).eq("user_id", user.id).single(); if (!template) return { error: "Workout routine not found." }; }
  let workout: { id: string } | null = null; let workoutError: { message: string } | null = null;
  if (typeof workoutId === "string" && workoutId) {
    const { data: existing } = await supabase.from("workouts").select("id").eq("id", workoutId).eq("user_id", user.id).single();
    if (!existing) return { error: "Workout not found." };
    const { error: clearError } = await supabase.from("workout_sets").delete().eq("workout_id", existing.id).eq("user_id", user.id); if (clearError) return { error: "Unable to update workout sets." };
    const result = await supabase.from("workouts").update({ performed_on: parsed.data.performedOn, template_id: parsed.data.templateId, completed_at: new Date().toISOString() }).eq("id", existing.id).eq("user_id", user.id).select("id").single(); workout = result.data; workoutError = result.error;
  } else { const result = await supabase.from("workouts").insert({ user_id: user.id, template_id: parsed.data.templateId, performed_on: parsed.data.performedOn, completed_at: new Date().toISOString() }).select("id").single(); workout = result.data; workoutError = result.error; }
  if (workoutError || !workout) return { error: "Unable to save the workout." };
  const { error: setsError } = await supabase.from("workout_sets").insert(parsed.data.sets.map((set) => ({ user_id: user.id, workout_id: workout.id, exercise_id: set.exerciseId, set_number: set.setNumber, weight_kg: set.weightKg, reps: set.reps, duration_seconds: set.durationSeconds, rir: set.rir })));
  if (setsError) { await supabase.from("workouts").delete().eq("id", workout.id).eq("user_id", user.id); return { error: "Unable to save workout sets." }; }
  revalidatePath("/gym"); revalidatePath("/gym/history"); revalidatePath("/gym/progress");
  return { message: typeof workoutId === "string" && workoutId ? "Workout updated." : "Workout saved to your history." };
}
