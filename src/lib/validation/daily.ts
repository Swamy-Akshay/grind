import { z } from "zod";
export const dailyEntrySchema = z.object({
  taskId: z.string().uuid(),
  entryDate: z.iso.date(),
  focusedTime: z.string().max(5),
  evidence: z.string().trim().max(2000),
});

export const taskPlanItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(40),
  priority: z.number().int().min(1).max(50),
  dailyTargetMinutes: z.number().int().min(1).max(1440),
  completionMode: z.enum(["focused_time", "checkbox"]),
});

export const taskAreasSchema = z.array(z.string().trim().min(1).max(40)).min(1).max(20).superRefine((areas, context) => {
  if (new Set(areas.map((area) => area.toLocaleLowerCase())).size !== areas.length) context.addIssue({ code: "custom", message: "Area names must be unique." });
});

export const taskPlanSchema = z.array(taskPlanItemSchema).min(1).max(50).superRefine((tasks, context) => {
  const priorities = tasks.map((task) => task.priority).sort((a, b) => a - b);
  if (priorities.some((priority, index) => priority !== index + 1)) context.addIssue({ code: "custom", message: "Task numbers must be a complete sequence starting at 1." });
});
