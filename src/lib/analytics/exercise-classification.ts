export type MuscleGroup =
  | "Chest"
  | "Lats"
  | "Mid-back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Forearms"
  | "Quadriceps"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Core"
  | "Traps"
  | string;

export type ExerciseMetadata = { id: string; name: string; muscleGroup: string; trackingMode: "weight_reps" | "duration" };
export type ExerciseClassification = { primary: MuscleGroup; secondary: MuscleGroup[]; movementCategory?: string };

const normalized = (value: string) => value.trim().toLowerCase();
const includesAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

/**
 * Recognized library exercises are classified here so UI filter groups do not
 * redefine analytics (for example, forearm work remains forearm work).
 * Unknown user exercises keep their stored group as the safe fallback.
 */
export function classifyExercise(exercise: ExerciseMetadata): ExerciseClassification {
  const name = normalized(exercise.name);
  if (includesAny(name, ["wrist curl", "wrist extension", "wrist roller", "grip strengthener", "reverse curl"])) return { primary: "Forearms", secondary: name.includes("reverse curl") ? ["Biceps"] : [], movementCategory: "Wrist / grip" };
  if (includesAny(name, ["calf raise", "tibialis"])) return { primary: "Calves", secondary: [], movementCategory: "Calf raise" };
  if (includesAny(name, ["leg curl", "nordic curl", "romanian deadlift"])) return { primary: "Hamstrings", secondary: ["Glutes"], movementCategory: "Hip hinge / knee flexion" };
  if (includesAny(name, ["hip thrust", "hip abduction", "hip adduction"])) return { primary: "Glutes", secondary: [], movementCategory: "Hip" };
  if (includesAny(name, ["squat", "leg press", "leg extension", "lunge", "step-up", "hack squat", "goblet squat"])) return { primary: "Quadriceps", secondary: ["Glutes"], movementCategory: "Knee dominant" };
  if (includesAny(name, ["deadlift", "back extension", "hyperextension"])) return { primary: "Hamstrings", secondary: ["Glutes"], movementCategory: "Hip hinge" };
  if (includesAny(name, ["crunch", "plank", "dead bug", "leg raise", "knee raise", "bicycle"])) return { primary: "Core", secondary: [], movementCategory: "Core" };
  if (includesAny(name, ["shrug"])) return { primary: "Traps", secondary: [], movementCategory: "Elevation" };
  if (includesAny(name, ["pulldown", "pull-up", "straight-arm"])) return { primary: "Lats", secondary: ["Biceps"], movementCategory: "Vertical pull" };
  if (includesAny(name, ["row", "scapular pull-up"])) return { primary: "Mid-back", secondary: ["Lats", "Biceps"], movementCategory: "Row" };
  if (includesAny(name, ["curl"])) return { primary: "Biceps", secondary: ["Forearms"], movementCategory: "Elbow flexion" };
  if (includesAny(name, ["lateral raise", "shoulder press", "military press", "arnold press", "reverse fly", "reverse pec", "face pull", "external rotation", "reverse cable crossover"])) return { primary: "Shoulders", secondary: [], movementCategory: "Shoulder" };
  if (includesAny(name, ["pushdown", "triceps", "skull crusher", "extension", "close-grip bench", "dips"])) return { primary: "Triceps", secondary: [], movementCategory: "Elbow extension" };
  if (includesAny(name, ["bench", "chest press", "pec deck", "butterfly", "cable crossover"])) return { primary: "Chest", secondary: ["Triceps", "Shoulders"], movementCategory: "Press / fly" };
  return { primary: exercise.muscleGroup.trim() || "Unclassified", secondary: [] };
}
