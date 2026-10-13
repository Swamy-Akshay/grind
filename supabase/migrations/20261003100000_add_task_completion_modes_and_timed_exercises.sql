alter table public.tasks add column completion_mode text not null default 'focused_time'
  check (completion_mode in ('focused_time', 'checkbox'));
alter table public.daily_entries add column is_completed boolean not null default false;

-- Sleep and the daily gym attendance task are habits: record completion, never focused-work minutes.
update public.tasks set completion_mode = 'checkbox'
where lower(name) in ('sleep', 'gym');

alter table public.exercises add column tracking_mode text not null default 'weight_reps'
  check (tracking_mode in ('weight_reps', 'duration'));
alter table public.workout_sets add column duration_seconds integer check (duration_seconds between 1 and 86400);
alter table public.workout_sets alter column reps drop not null;
alter table public.workout_sets alter column weight_kg drop not null;
alter table public.workout_sets alter column weight_kg drop default;
alter table public.workout_sets add constraint workout_sets_tracking_values_check check (
  (duration_seconds is not null and weight_kg is null and reps is null)
  or (duration_seconds is null and weight_kg is not null and reps is not null)
);
