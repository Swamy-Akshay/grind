create table public.exercises (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  muscle_group text not null check (char_length(trim(muscle_group)) between 1 and 40),
  movement text, target_muscle text, recommended_sets smallint not null default 3 check (recommended_sets between 1 and 8),
  status text not null default 'performed' check (status in ('performed', 'considered')), is_active boolean not null default true,
  created_at timestamptz not null default now(), unique(user_id, name)
);
create table public.workout_templates (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80), split_day text, position smallint not null default 1 check (position between 1 and 20),
  is_active boolean not null default true, created_at timestamptz not null default now(), unique(user_id, name)
);
create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.workout_templates(id) on delete cascade, exercise_id uuid not null references public.exercises(id) on delete restrict,
  position smallint not null check (position between 1 and 50), target_sets smallint not null check (target_sets between 1 and 8), unique(template_id, exercise_id), unique(template_id, position)
);
create table public.workouts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.workout_templates(id) on delete set null, performed_on date not null default current_date,
  notes text check (char_length(notes) <= 2000), completed_at timestamptz, created_at timestamptz not null default now()
);
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade, exercise_id uuid not null references public.exercises(id) on delete restrict,
  set_number smallint not null check (set_number between 1 and 20), weight_kg numeric(7,2) not null default 0 check (weight_kg >= 0 and weight_kg <= 2000),
  reps smallint not null check (reps between 1 and 100), rir smallint check (rir between 0 and 10), created_at timestamptz not null default now(), unique(workout_id, exercise_id, set_number)
);
create index workouts_user_date_idx on public.workouts(user_id, performed_on desc);
create index workout_sets_workout_idx on public.workout_sets(workout_id);
alter table public.exercises enable row level security; alter table public.workout_templates enable row level security; alter table public.workout_template_exercises enable row level security; alter table public.workouts enable row level security; alter table public.workout_sets enable row level security;
create policy "Users manage own exercises" on public.exercises for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own workout templates" on public.workout_templates for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own template exercises" on public.workout_template_exercises for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own workouts" on public.workouts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own workout sets" on public.workout_sets for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.seed_default_gym_data(target_user_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare push_id uuid; legs_id uuid; pull_id uuid;
begin
  insert into public.exercises (user_id,name,muscle_group,movement,target_muscle,recommended_sets) values
  (target_user_id,'Flat Barbell Bench Press','Chest','Horizontal press','Pectoralis major',4),(target_user_id,'Incline Dumbbell Bench Press','Chest','Incline press','Upper chest',3),(target_user_id,'DB Lateral Raise','Shoulders','Shoulder abduction','Lateral deltoid',3),(target_user_id,'Rope Triceps Pushdown','Triceps','Elbow extension','Triceps',3),
  (target_user_id,'Smith Machine Squat','Legs','Squat','Quadriceps and glutes',4),(target_user_id,'Romanian Deadlift — DB','Legs','Hip hinge','Hamstrings and glutes',3),(target_user_id,'Leg Extension','Legs','Knee extension','Quadriceps',3),(target_user_id,'Lying Leg Curl','Legs','Knee flexion','Hamstrings',3),(target_user_id,'Smith Standing Calf Raise','Legs','Plantarflexion','Calves',3),
  (target_user_id,'Wide-Grip Pulldown','Back','Vertical pull','Latissimus dorsi',3),(target_user_id,'Seated Cable Row','Back','Horizontal pull','Mid-back',3),(target_user_id,'One-Arm DB Row','Back','Unilateral row','Lats and mid-back',3),(target_user_id,'Reverse Pec Deck','Shoulders','Horizontal abduction','Rear delts',3),(target_user_id,'Preacher Curl','Biceps','Elbow flexion','Biceps',3),(target_user_id,'Hammer Curl','Biceps','Neutral-grip curl','Brachialis and forearm',3)
  on conflict (user_id,name) do nothing;
  insert into public.workout_templates(user_id,name,split_day,position) values (target_user_id,'Push','Push',1),(target_user_id,'Legs','Legs',2),(target_user_id,'Pull','Pull',3) on conflict (user_id,name) do nothing;
  select id into push_id from public.workout_templates where user_id=target_user_id and name='Push'; select id into legs_id from public.workout_templates where user_id=target_user_id and name='Legs'; select id into pull_id from public.workout_templates where user_id=target_user_id and name='Pull';
  insert into public.workout_template_exercises(user_id,template_id,exercise_id,position,target_sets)
  select target_user_id,push_id,id,row_number() over(order by name)::smallint,recommended_sets from public.exercises where user_id=target_user_id and name in ('Flat Barbell Bench Press','Incline Dumbbell Bench Press','DB Lateral Raise','Rope Triceps Pushdown') on conflict do nothing;
  insert into public.workout_template_exercises(user_id,template_id,exercise_id,position,target_sets)
  select target_user_id,legs_id,id,row_number() over(order by name)::smallint,recommended_sets from public.exercises where user_id=target_user_id and name in ('Smith Machine Squat','Romanian Deadlift — DB','Leg Extension','Lying Leg Curl','Smith Standing Calf Raise') on conflict do nothing;
  insert into public.workout_template_exercises(user_id,template_id,exercise_id,position,target_sets)
  select target_user_id,pull_id,id,row_number() over(order by name)::smallint,recommended_sets from public.exercises where user_id=target_user_id and name in ('Wide-Grip Pulldown','Seated Cable Row','One-Arm DB Row','Reverse Pec Deck','Preacher Curl','Hammer Curl') on conflict do nothing;
end; $$;
select public.seed_default_gym_data(id) from auth.users;
create or replace function public.seed_new_user_gym_data() returns trigger language plpgsql security definer set search_path = public as $$ begin perform public.seed_default_gym_data(new.id); return new; end; $$;
create trigger on_auth_user_created_seed_gym_data after insert on auth.users for each row execute procedure public.seed_new_user_gym_data();
