create table if not exists public.student_results (
  id text primary key check (char_length(id) between 1 and 80),
  student_name text not null check (char_length(student_name) between 1 and 60),
  group_name text not null default '' check (char_length(group_name) <= 40),
  completed_at timestamptz not null,
  score_part1 integer not null check (score_part1 between 0 and 5),
  score_part2 integer not null check (score_part2 between 0 and 5),
  score_part3 integer not null check (score_part3 between 0 and 5),
  total_correct integer not null check (total_correct between 0 and 15),
  total_questions integer not null check (total_questions = 15),
  percent integer not null check (percent between 0 and 100),
  duration_seconds integer not null check (duration_seconds >= 0),
  missed jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint student_results_score_matches check (
    total_correct = score_part1 + score_part2 + score_part3
  ),
  constraint student_results_percent_matches check (
    percent = round(100.0 * total_correct / total_questions)
  )
);

alter table public.student_results enable row level security;

revoke all on table public.student_results from anon, authenticated;
grant insert on table public.student_results to anon;
grant select on table public.student_results to authenticated;

drop policy if exists "Anyone can submit an assessment result" on public.student_results;
create policy "Anyone can submit an assessment result"
  on public.student_results
  for insert
  to anon
  with check (true);

drop policy if exists "Authorized admins can view assessment results" on public.student_results;
create policy "Authorized admins can view assessment results"
  on public.student_results
  for select
  to authenticated
  using (
    (select auth.jwt() ->> 'email') in (
      'vasquezjuli310@gmail.com',
      'vasquezjuli310@gmail.com'
    )
  );
