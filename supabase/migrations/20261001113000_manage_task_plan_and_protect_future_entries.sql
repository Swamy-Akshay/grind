alter table public.tasks drop constraint if exists tasks_priority_range;
alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.tasks add constraint tasks_priority_range check (priority between 1 and 100);

delete from public.tasks where name = 'Wake-up Routine';

insert into public.tasks (user_id, name, category, priority, daily_target_minutes)
select id, 'Gym', 'lifestyle', 1, 60 from auth.users
on conflict (user_id, name) do nothing;

with numbered_tasks as (
  select id, row_number() over (partition by user_id order by priority desc, created_at asc)::smallint as new_priority
  from public.tasks
)
update public.tasks tasks set priority = numbered_tasks.new_priority + 50
from numbered_tasks where tasks.id = numbered_tasks.id;

update public.tasks set priority = priority - 50;
alter table public.tasks drop constraint if exists tasks_user_priority_unique;
alter table public.tasks add constraint tasks_user_priority_unique unique (user_id, priority) deferrable initially deferred;

create or replace function public.ensure_task_priority_sequence()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  expected_count integer;
  actual_sum integer;
begin
  select count(*), coalesce(sum(priority), 0)
  into expected_count, actual_sum
  from public.tasks
  where user_id = coalesce(new.user_id, old.user_id);
  if actual_sum <> expected_count * (expected_count + 1) / 2 then
    raise exception 'Task priorities must be a complete sequence from 1 to %.', expected_count;
  end if;
  return null;
end;
$$;

drop trigger if exists tasks_require_priority_sequence on public.tasks;
create constraint trigger tasks_require_priority_sequence
after insert or update or delete on public.tasks
deferrable initially deferred
for each row execute procedure public.ensure_task_priority_sequence();

create or replace function public.reject_future_daily_entry()
returns trigger
language plpgsql
security invoker set search_path = public
as $$
begin
  if new.entry_date > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Focused time cannot be recorded for a future date.';
  end if;
  return new;
end;
$$;

drop trigger if exists daily_entries_reject_future_dates on public.daily_entries;
create trigger daily_entries_reject_future_dates
before insert or update on public.daily_entries
for each row execute procedure public.reject_future_daily_entry();

create or replace function public.replace_task_plan(plan jsonb)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  item jsonb;
  item_id uuid;
  item_name text;
  item_category text;
  item_priority smallint;
  item_target integer;
  plan_count integer;
begin
  if caller_id is null then raise exception 'Authentication required.'; end if;
  if jsonb_typeof(plan) <> 'array' or jsonb_array_length(plan) < 1 or jsonb_array_length(plan) > 50 then raise exception 'Task plan must contain 1 to 50 tasks.'; end if;
  select count(*) into plan_count from jsonb_array_elements(plan);
  if (select count(distinct (value->>'priority')::integer) from jsonb_array_elements(plan)) <> plan_count then raise exception 'Each task priority must be unique.'; end if;
  if (select min((value->>'priority')::integer) from jsonb_array_elements(plan)) <> 1 or (select max((value->>'priority')::integer) from jsonb_array_elements(plan)) <> plan_count then raise exception 'Priorities must run from 1 to % without gaps.', plan_count; end if;

  update public.tasks set priority = priority + 50 where user_id = caller_id;
  for item in select value from jsonb_array_elements(plan) loop
    item_id := nullif(item->>'id', '')::uuid;
    item_name := trim(item->>'name');
    item_category := item->>'category';
    item_priority := (item->>'priority')::smallint;
    item_target := (item->>'dailyTargetMinutes')::integer;
    if char_length(item_name) not between 1 and 120 or item_category not in ('career', 'lifestyle') or item_target not between 1 and 1440 then raise exception 'One or more task values are invalid.'; end if;
    if item_id is null then
      insert into public.tasks (user_id, name, category, priority, daily_target_minutes) values (caller_id, item_name, item_category, item_priority, item_target);
    else
      update public.tasks set name = item_name, category = item_category, priority = item_priority, daily_target_minutes = item_target where id = item_id and user_id = caller_id;
      if not found then raise exception 'Task not found.'; end if;
    end if;
  end loop;
  delete from public.tasks where user_id = caller_id and priority > 50;
end;
$$;

revoke all on function public.replace_task_plan(jsonb) from public;
grant execute on function public.replace_task_plan(jsonb) to authenticated;

create or replace function public.seed_default_daily_tasks(target_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.tasks (user_id, name, category, priority, daily_target_minutes)
  values
    (target_user_id, 'DSA', 'career', 1, 90),
    (target_user_id, 'Project', 'career', 2, 90),
    (target_user_id, 'Technical Learning', 'career', 3, 90),
    (target_user_id, 'Job Search', 'career', 4, 60),
    (target_user_id, 'Interview Preparation', 'career', 5, 45),
    (target_user_id, 'Verbal Practice', 'career', 6, 30),
    (target_user_id, 'Gym', 'lifestyle', 7, 60),
    (target_user_id, 'Reading', 'lifestyle', 8, 30),
    (target_user_id, 'Sleep', 'lifestyle', 9, 450)
  on conflict (user_id, name) do nothing;
end;
$$;
