alter table public.exercises
  add column if not exists secondary_muscle_group text
  check (secondary_muscle_group is null or char_length(trim(secondary_muscle_group)) between 1 and 40);
