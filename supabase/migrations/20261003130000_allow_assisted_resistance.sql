alter table public.workout_sets drop constraint if exists workout_sets_weight_kg_check;
alter table public.workout_sets add constraint workout_sets_weight_kg_check
  check (weight_kg is null or weight_kg between -2000 and 2000);
