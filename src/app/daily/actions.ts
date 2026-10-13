"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dailyEntrySchema, taskAreasSchema, taskPlanSchema } from "@/lib/validation/daily";
import { focusedTimeToMinutes } from "@/lib/utils/focused-time";

export type DailyFormState = { error?: string; message?: string };

function indiaToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  return { supabase, user };
}

export async function saveDailyEntry(_: DailyFormState, formData: FormData): Promise<DailyFormState> {
  const parsed = dailyEntrySchema.safeParse({
    taskId: formData.get("taskId"),
    entryDate: formData.get("entryDate"),
    focusedTime: formData.get("focusedTime"),
    evidence: formData.get("evidence"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid daily entry." };
  if (parsed.data.entryDate > indiaToday()) return { error: "Future dates cannot receive focused time or an output record." };
  const isCompleted = formData.get("isCompleted") === "true";
  let focusedMinutes: number;
  try {
    focusedMinutes = focusedTimeToMinutes(parsed.data.focusedTime);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Enter time as HH:MM." };
  }

  const { supabase, user } = await getAuthenticatedUser();
  const { data: task, error: taskError } = await supabase.from("tasks").select("id,completion_mode").eq("id", parsed.data.taskId).eq("user_id", user.id).single();
  if (taskError || !task) return { error: "Task not found." };

  if (task.completion_mode === "checkbox" && !isCompleted) {
    const { error: deleteError } = await supabase.from("daily_entries").delete().eq("user_id", user.id).eq("task_id", task.id).eq("entry_date", parsed.data.entryDate);
    if (deleteError) return { error: "Unable to clear the empty entry." };
    revalidatePath("/daily");
    revalidatePath("/history");
    revalidatePath("/analytics");
    return { message: "No time recorded; the empty entry was not saved." };
  }

  if (task.completion_mode === "checkbox") focusedMinutes = 0;
  if (task.completion_mode === "focused_time" && focusedMinutes === 0) {
    const { error: deleteError } = await supabase.from("daily_entries").delete().eq("user_id", user.id).eq("task_id", task.id).eq("entry_date", parsed.data.entryDate);
    if (deleteError) return { error: "Unable to clear the empty entry." };
    revalidatePath("/daily"); return { message: "No time recorded; the empty entry was not saved." };
  }
  const { data: entry, error: entryError } = await supabase
    .from("daily_entries")
    .upsert({ user_id: user.id, task_id: task.id, entry_date: parsed.data.entryDate, focused_minutes: focusedMinutes, is_completed: task.completion_mode === "checkbox" }, { onConflict: "task_id,entry_date" })
    .select("id")
    .single();
  if (entryError || !entry) return { error: "Unable to save focused time." };

  if (parsed.data.evidence) {
    const { error: evidenceError } = await supabase.from("daily_outputs").upsert({ user_id: user.id, daily_entry_id: entry.id, content: parsed.data.evidence }, { onConflict: "daily_entry_id" });
    if (evidenceError) return { error: "Focused time was saved, but evidence could not be saved." };
  } else {
    const { error: deleteError } = await supabase.from("daily_outputs").delete().eq("daily_entry_id", entry.id).eq("user_id", user.id);
    if (deleteError) return { error: "Focused time was saved, but evidence could not be updated." };
  }

  revalidatePath("/daily");
  revalidatePath("/history");
  revalidatePath("/analytics");
  return { message: "Daily entry saved." };
}

export async function saveTaskPlan(_: DailyFormState, formData: FormData): Promise<DailyFormState> {
  const rawPlan = formData.get("plan");
  if (typeof rawPlan !== "string") return { error: "Task plan is missing." };
  let plan: unknown;
  try { plan = JSON.parse(rawPlan); } catch { return { error: "Task plan could not be read." }; }
  const parsed = taskPlanSchema.safeParse(plan);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Task plan is invalid." };

  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.rpc("replace_task_plan", { plan: parsed.data });
  if (error) return { error: error.message.includes("Task priorities") ? "Task numbers must be unique and continuous." : "Unable to save the task plan." };
  revalidatePath("/daily");
  revalidatePath("/history");
  revalidatePath("/analytics");
  return { message: "Daily task plan updated." };
}

export async function saveTaskAreas(_: DailyFormState, formData: FormData): Promise<DailyFormState> {
  const rawAreas = formData.get("areas");
  if (typeof rawAreas !== "string") return { error: "Areas are missing." };
  let areas: unknown;
  try { areas = JSON.parse(rawAreas); } catch { return { error: "Areas could not be read." }; }
  const parsed = taskAreasSchema.safeParse(areas);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Areas are invalid." };
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.rpc("replace_task_areas", { area_names: parsed.data });
  if (error) return { error: error.message.includes("Move or delete") ? error.message : "Unable to save areas." };
  revalidatePath("/daily");
  return { message: "Task areas updated." };
}
