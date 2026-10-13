update public.tasks set category = 'lifestyle' where category = 'fitness';

alter table public.tasks drop constraint if exists tasks_category_check;
alter table public.tasks add constraint tasks_category_check check (category in ('career', 'lifestyle'));

create unique index if not exists tasks_user_name_unique_idx on public.tasks (user_id, name);

create or replace function public.seed_default_daily_tasks(target_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.tasks (user_id, name, category, priority, daily_target_minutes)
  values
    (target_user_id, 'DSA', 'career', 10, 90),
    (target_user_id, 'Project', 'career', 9, 90),
    (target_user_id, 'Technical Learning', 'career', 8, 90),
    (target_user_id, 'Job Search', 'career', 7, 60),
    (target_user_id, 'Interview Preparation', 'career', 6, 45),
    (target_user_id, 'Verbal Practice', 'career', 5, 30),
    (target_user_id, 'Reading', 'lifestyle', 3, 30),
    (target_user_id, 'Wake-up Routine', 'lifestyle', 2, 30),
    (target_user_id, 'Sleep', 'lifestyle', 1, 450)
  on conflict (user_id, name) do nothing;
end;
$$;

select public.seed_default_daily_tasks(id) from auth.users;

create function public.seed_new_user_daily_tasks()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.seed_default_daily_tasks(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created_seed_daily_tasks
  after insert on auth.users
  for each row execute procedure public.seed_new_user_daily_tasks();
