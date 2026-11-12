-- Preserve historical uncertainty instead of converting assistance or unknown load into ordinary resistance.
alter table public.workout_sets
  add column if not exists assistance_kg numeric(7,2) check (assistance_kg > 0 and assistance_kg <= 2000),
  add column if not exists source_text text check (char_length(source_text) <= 500);

alter table public.workout_sets
  drop constraint if exists workout_sets_tracking_values_check;

alter table public.workout_sets
  add constraint workout_sets_tracking_values_check check (
    (duration_seconds is not null and weight_kg is null and reps is null and assistance_kg is null)
    or (
      duration_seconds is null
      and reps is not null
      and not (weight_kg is not null and assistance_kg is not null)
    )
  );
