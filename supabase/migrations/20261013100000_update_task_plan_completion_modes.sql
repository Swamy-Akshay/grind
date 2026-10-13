create or replace function public.replace_task_plan(plan jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare caller_id uuid := auth.uid(); item jsonb; item_id uuid; item_name text; item_category text; item_priority smallint; item_target integer; item_mode text; plan_count integer;
begin
  if caller_id is null then raise exception 'Authentication required.'; end if;
  if jsonb_typeof(plan) <> 'array' or jsonb_array_length(plan) < 1 or jsonb_array_length(plan) > 50 then raise exception 'Task plan must contain 1 to 50 tasks.'; end if;
  select count(*) into plan_count from jsonb_array_elements(plan);
  if (select count(distinct (value->>'priority')::integer) from jsonb_array_elements(plan)) <> plan_count then raise exception 'Each task number must be unique.'; end if;
  if (select min((value->>'priority')::integer) from jsonb_array_elements(plan)) <> 1 or (select max((value->>'priority')::integer) from jsonb_array_elements(plan)) <> plan_count then raise exception 'Task numbers must run continuously.'; end if;
  update public.tasks set priority = priority + 50 where user_id = caller_id;
  for item in select value from jsonb_array_elements(plan) loop
    item_id := nullif(item->>'id', '')::uuid; item_name := trim(item->>'name'); item_category := trim(item->>'category'); item_priority := (item->>'priority')::smallint; item_target := (item->>'dailyTargetMinutes')::integer; item_mode := item->>'completionMode';
    if char_length(item_name) not between 1 and 120 or item_target not between 1 and 1440 or item_mode not in ('focused_time','checkbox') or not exists (select 1 from public.task_areas where user_id=caller_id and lower(name)=lower(item_category)) then raise exception 'One or more task values are invalid.'; end if;
    if item_id is null then insert into public.tasks(user_id,name,category,priority,daily_target_minutes,completion_mode) values(caller_id,item_name,item_category,item_priority,item_target,item_mode);
    else update public.tasks set name=item_name,category=item_category,priority=item_priority,daily_target_minutes=item_target,completion_mode=item_mode where id=item_id and user_id=caller_id; if not found then raise exception 'Task not found.'; end if; end if;
  end loop;
  delete from public.tasks where user_id=caller_id and priority>50;
end; $$;
