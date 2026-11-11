import { z } from "zod";

export const workoutSetSchema = z.object({
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1).max(20),
  trackingMode: z.enum(["weight_reps", "duration"]),
  weightKg: z.number().min(-2000).max(2000).nullable(),
  reps: z.number().int().min(1).max(100).nullable(),
  durationSeconds: z.number().int().min(1).max(86400).nullable(),
  rir: z.number().int().min(0).max(10).nullable(),
  setType: z.enum(["warmup", "working"]).nullable(),
}).superRefine((set, context) => {
  if (set.trackingMode === "duration" && (set.durationSeconds === null || set.weightKg !== null || set.reps !== null)) context.addIssue({ code: "custom", message: "Timed sets need a duration only." });
  if (set.trackingMode === "weight_reps" && (set.weightKg === null || set.reps === null || set.durationSeconds !== null)) context.addIssue({ code: "custom", message: "Strength sets need weight and reps." });
  if (set.trackingMode === "duration" && (set.rir !== null || set.setType !== null)) context.addIssue({ code: "custom", message: "Timed sets cannot use resistance-set details." });
});

export const workoutSubmissionSchema = z.object({
  templateId: z.string().uuid().nullable(),
  performedOn: z.iso.date(),
  notes: z.string().trim().max(2000),
  sets: z.array(workoutSetSchema).min(1).max(200),
});

export const trainingScheduleSchema = z.object({
  effectiveOn: z.iso.date(),
  plannedWeekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7).transform((days) => [...new Set(days)].sort((left, right) => left - right)),
});
