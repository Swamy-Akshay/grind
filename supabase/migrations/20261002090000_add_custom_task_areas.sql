create table public.task_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);

create unique index task_areas_user_name_unique_idx on public.task_areas (user_id, lower(name));
alter table public.task_areas enable row level security;
create policy "Users manage their own task areas" on public.task_areas for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into public.task_areas (user_id, name)
select id, area_name from auth.users cross join (values ('Career'), ('Lifestyle')) as defaults(area_name)
on conflict do nothing;

-- The original MVP allowed only lowercase career/lifestyle/fitness values.
-- Replace that narrow check before normalizing existing values or accepting custom areas.
alter table public.tasks drop constraint if exists tasks_category_check;
alter table public.tasks add constraint tasks_category_check
  check (char_length(trim(category)) between 1 and 40);

update public.tasks set category = initcap(category);

create or replace function public.seed_default_task_areas(target_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.task_areas (user_id, name) values (target_user_id, 'Career'), (target_user_id, 'Lifestyle') on conflict do nothing;
end;
$$;

create or replace function public.seed_new_user_task_areas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_default_task_areas(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created_seed_task_areas after insert on auth.users for each row execute procedure public.seed_new_user_task_areas();

create or replace function public.replace_task_plan(plan jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  caller_id uuid := auth.uid(); item jsonb; item_id uuid; item_name text; item_category text; item_priority smallint; item_target integer; plan_count integer;
begin
  if caller_id is null then raise exception 'Authentication required.'; end if;
  if jsonb_typeof(plan) <> 'array' or jsonb_array_length(plan) < 1 or jsonb_array_length(plan) > 50 then raise exception 'Task plan must contain 1 to 50 tasks.'; end if;
  select count(*) into plan_count from jsonb_array_elements(plan);
  if (select count(distinct (value->>'priority')::integer) from jsonb_array_elements(plan)) <> plan_count then raise exception 'Each task number must be unique.'; end if;
  if (select min((value->>'priority')::integer) from jsonb_array_elements(plan)) <> 1 or (select max((value->>'priority')::integer) from jsonb_array_elements(plan)) <> plan_count then raise exception 'Task numbers must run from 1 to % without gaps.', plan_count; end if;
  update public.tasks set priority = priority + 50 where user_id = caller_id;
  for item in select value from jsonb_array_elements(plan) loop
    item_id := nullif(item->>'id', '')::uuid; item_name := trim(item->>'name'); item_category := trim(item->>'category'); item_priority := (item->>'priority')::smallint; item_target := (item->>'dailyTargetMinutes')::integer;
    if char_length(item_name) not between 1 and 120 or item_target not between 1 and 1440 or not exists (select 1 from public.task_areas where user_id = caller_id and lower(name) = lower(item_category)) then raise exception 'One or more task values are invalid.'; end if;
    if item_id is null then insert into public.tasks (user_id, name, category, priority, daily_target_minutes) values (caller_id, item_name, item_category, item_priority, item_target);
    else update public.tasks set name = item_name, category = item_category, priority = item_priority, daily_target_minutes = item_target where id = item_id and user_id = caller_id; if not found then raise exception 'Task not found.'; end if; end if;
  end loop;
  delete from public.tasks where user_id = caller_id and priority > 50;
end;
$$;

create or replace function public.replace_task_areas(area_names jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare caller_id uuid := auth.uid(); area_name text;
begin
  if caller_id is null then raise exception 'Authentication required.'; end if;
  if jsonb_typeof(area_names) <> 'array' or jsonb_array_length(area_names) < 1 or jsonb_array_length(area_names) > 20 then raise exception 'Use 1 to 20 areas.'; end if;
  if exists (select 1 from jsonb_array_elements_text(area_names) value where char_length(trim(value)) not between 1 and 40) then raise exception 'Area names must be 1 to 40 characters.'; end if;
  if (select count(distinct lower(trim(value))) from jsonb_array_elements_text(area_names) value) <> jsonb_array_length(area_names) then raise exception 'Area names must be unique.'; end if;
  if exists (select 1 from public.tasks t where t.user_id = caller_id and not exists (select 1 from jsonb_array_elements_text(area_names) value where lower(trim(value)) = lower(t.category))) then raise exception 'Move or delete tasks from an area before removing it.'; end if;
  delete from public.task_areas where user_id = caller_id;
  for area_name in select trim(value) from jsonb_array_elements_text(area_names) value loop insert into public.task_areas (user_id, name) values (caller_id, area_name); end loop;
end;
$$;

revoke all on function public.replace_task_areas(jsonb) from public;
grant execute on function public.replace_task_areas(jsonb) to authenticated;
