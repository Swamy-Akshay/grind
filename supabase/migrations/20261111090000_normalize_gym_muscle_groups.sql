-- Keep exercise IDs and workout history intact while simplifying the library filters.
update public.exercises
set muscle_group = 'Shoulders'
where lower(muscle_group) in ('rear delts', 'rear delt', 'shoulder');

-- Forearm-specific entries remain in the library but are grouped with Biceps.
update public.exercises
set muscle_group = 'Biceps'
where lower(muscle_group) in ('forearms', 'forearm');
