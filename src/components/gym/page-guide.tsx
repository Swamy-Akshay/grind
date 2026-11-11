const common = [
  "The Daily button returns to Daily Progress; Gym records never add focused-work time or Daily task score.",
  "Routines are reusable exercise lists only. They do not impose a training split or award points.",
  "Total Resistance Volume Load is recorded weight × repetitions; timed movements do not add resistance volume.",
  "A negative weight can represent assistance on an appropriate exercise, while reps must be a positive whole number.",
  "Workout history is editable and deletable, so correct inaccurate records instead of leaving misleading data.",
];

const pagePoints = {
  today: [
    "Use the date controls in the Gym navigation bar to open a workout day. Sunday is excluded from weekly chart points.",
    "Select a routine or add individual exercises. Individual exercise order follows the order in which you selected them.",
    "For resistance movements, choose Warm-up or Working before adding the set. New sets default to Working; optional RIR means repetitions in reserve.",
    "Enter weight and reps once, then Add set. The values stay available for the next set until you change or clear them.",
    "Click a saved set only when you need its edit or delete controls.",
    "Finishing a workout saves it for that date. Returning to the same date reopens its latest saved session for editing.",
  ],
  routines: ["Search within the selected muscle group to find exercises before saving a routine.", "Saving changes replaces the routine’s exercise list; it does not alter completed workout history.", "Use routine starts a workout with that routine’s exercise order."],
  history: ["Each card is one saved workout session, grouped by exercise name and set order. Resistance sets show their type and optional RIR.", "Older resistance sets without a type remain Unclassified until you choose a type while editing.", "Edit opens the set logger for that session; Delete removes the whole session permanently."],
  progress: ["Exercise performance uses the highest eligible estimated 1RM from comparable resistance sets. Warm-ups are excluded; RIR does not alter the estimate.", "Working-set charts count each Working set once under its primary muscle group. Warm-up and Unclassified legacy sets stay separate.", "Consistency compares saved workouts with explicitly planned dates from your effective-dated schedule. Extra unplanned workouts do not increase it.", "Total Resistance Volume Load is weight × reps. It is a training-volume statistic, not a direct measure of strength or muscle growth.", "Monthly charts retain every Monday–Saturday date. The yearly chart retains exactly 52 weekly points and 12 month boundaries."],
  library: ["Use the search field and muscle-group dropdown together: search results are limited to the selected group.", "Manage exercise library adds, edits, or deletes future exercise options. Existing workout sets retain their recorded exercise facts.", "Forearm exercises are grouped under Biceps and rear-delt exercises are grouped under Shoulders for simpler filtering."],
};

export function GymPageGuide({ page }: { page: keyof typeof pagePoints }) {
  const intro = page === "today" ? "How Today works" : page === "routines" ? "How Routines work" : page === "history" ? "How History works" : page === "library" ? "How Exercise Library works" : "How Progress works";
  return <section className="mt-12 text-sm leading-6 text-zinc-500"><h2 className="font-medium text-zinc-400">{intro}</h2><ul className="mt-3 list-disc space-y-1 pl-5">{[...pagePoints[page], ...common].map((item) => <li key={item}>{item}</li>)}</ul></section>;
}
