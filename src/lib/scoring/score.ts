export type TaskCategory = string;

export type ScoreableTask = {
  id: string;
  category: TaskCategory;
  priority: number;
  targetMinutes: number;
  completionMode?: "focused_time" | "checkbox";
};

export type ScoreableEntry = { taskId: string; focusedMinutes: number; isCompleted?: boolean };

export type TaskScore = ScoreableTask & {
  focusedMinutes: number;
  rewardPoints: number;
  basePoints: number;
  bonusMinutes: number;
};

export type DailyScore = {
  taskScores: TaskScore[];
  basePoints: number;
  maximumBasePoints: number;
  bonusMinutes: number;
  focusedMinutes: number;
  byCategory: Record<string, number>;
};

const precision = (value: number) => Math.round(value * 100) / 100;

export function scoreTask(task: ScoreableTask, focusedMinutes: number, rewardPoints = task.priority, isCompleted = false): TaskScore {
  if (!Number.isInteger(task.priority) || task.priority < 1) throw new Error("Task number must be a positive integer.");
  if (!Number.isInteger(rewardPoints) || rewardPoints < 1) throw new Error("Reward points must be a positive integer.");
  if (!Number.isFinite(task.targetMinutes) || task.targetMinutes <= 0) throw new Error("Target minutes must be greater than zero.");
  if (!Number.isFinite(focusedMinutes) || focusedMinutes < 0) throw new Error("Focused minutes cannot be negative.");

  const safeMinutes = Math.floor(focusedMinutes);
  return {
    ...task,
    focusedMinutes: safeMinutes,
    rewardPoints,
    basePoints: task.completionMode === "checkbox" ? (isCompleted ? rewardPoints : 0) : precision(rewardPoints * Math.min(safeMinutes / task.targetMinutes, 1)),
    bonusMinutes: Math.max(safeMinutes - task.targetMinutes, 0),
  };
}

export function calculateDailyScore(tasks: ScoreableTask[], entries: ScoreableEntry[]): DailyScore {
  const entriesByTask = new Map(entries.map((entry) => [entry.taskId, entry]));
  const taskScores = tasks.map((task) => { const entry = entriesByTask.get(task.id); return scoreTask(task, entry?.focusedMinutes ?? 0, tasks.length - task.priority + 1, entry?.isCompleted); });
  const byCategory: Record<string, number> = {};

  for (const score of taskScores) byCategory[score.category] = precision((byCategory[score.category] ?? 0) + score.basePoints);

  return {
    taskScores,
    basePoints: precision(taskScores.reduce((total, score) => total + score.basePoints, 0)),
    maximumBasePoints: taskScores.reduce((total, score) => total + score.rewardPoints, 0),
    bonusMinutes: taskScores.reduce((total, score) => total + score.bonusMinutes, 0),
    focusedMinutes: taskScores.reduce((total, score) => total + score.focusedMinutes, 0),
    byCategory,
  };
}
