-- Migración noviembre 2026 · Saber TyT 7 partes
-- NO BORRA NI MODIFICA la estructura de student_results. Solo agrega tablas nuevas
-- y actualiza la ficha de los resultados existentes a 3230441 (autorizado por la profesora).
-- Ejecutar completo en Supabase → SQL Editor.

-- (Opcional) Revisa antes qué fichas escribieron los estudiantes:
-- select group_name, count(*) from public.student_results group by group_name order by 2 desc;

begin;

create or replace function public.is_tyt_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((auth.jwt() ->> 'email') in ('vasquezjuli310@gmail.com'), false);
$$;

-- Fichas que la profesora habilita
create table if not exists public.fichas (
  code text primary key check (char_length(code) between 1 and 20),
  program text not null default '' check (char_length(program) <= 80),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.fichas enable row level security;
revoke all on table public.fichas from anon, authenticated;
grant select on table public.fichas to anon, authenticated;
grant insert, update on table public.fichas to authenticated;

drop policy if exists "Anyone can read active fichas" on public.fichas;
create policy "Anyone can read active fichas" on public.fichas
  for select to anon, authenticated using (active or public.is_tyt_admin());
drop policy if exists "Admins can add fichas" on public.fichas;
create policy "Admins can add fichas" on public.fichas
  for insert to authenticated with check (public.is_tyt_admin());
drop policy if exists "Admins can edit fichas" on public.fichas;
create policy "Admins can edit fichas" on public.fichas
  for update to authenticated using (public.is_tyt_admin()) with check (public.is_tyt_admin());

-- Resultados de Evaluación 2, 3 y final
create table if not exists public.assessment_results (
  id text primary key check (char_length(id) between 1 and 80),
  evaluation text not null check (evaluation in ('eval2', 'eval3', 'final')),
  student_name text not null check (char_length(student_name) between 1 and 60),
  student_key text not null check (char_length(student_key) between 1 and 60),
  ficha text not null references public.fichas(code),
  completed_at timestamptz not null,
  scores jsonb not null,
  total_correct integer not null check (total_correct >= 0),
  total_questions integer not null check (total_questions in (12, 28)),
  percent integer not null check (percent between 0 and 100),
  duration_seconds integer not null check (duration_seconds >= 0),
  missed jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint assessment_total_ok check (total_correct <= total_questions),
  constraint assessment_percent_ok check (percent = round(100.0 * total_correct / total_questions)),
  constraint assessment_questions_ok check ((evaluation = 'final') = (total_questions = 28))
);
-- La final solo una vez por aprendiz y ficha
create unique index if not exists assessment_final_once
  on public.assessment_results (ficha, student_key) where evaluation = 'final';

alter table public.assessment_results enable row level security;
revoke all on table public.assessment_results from anon, authenticated;
grant insert on table public.assessment_results to anon;
grant select on table public.assessment_results to authenticated;

drop policy if exists "Anyone can submit assessment" on public.assessment_results;
create policy "Anyone can submit assessment" on public.assessment_results
  for insert to anon
  with check (exists (select 1 from public.fichas f where f.code = ficha and f.active));
drop policy if exists "Admins can view assessments" on public.assessment_results;
create policy "Admins can view assessments" on public.assessment_results
  for select to authenticated using (public.is_tyt_admin());

-- Permite al sitio saber si un aprendiz ya presentó la final, sin exponer resultados
create or replace function public.final_already_taken(p_ficha text, p_key text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.assessment_results
                 where evaluation = 'final' and ficha = p_ficha and student_key = p_key);
$$;
revoke all on function public.final_already_taken(text, text) from public;
grant execute on function public.final_already_taken(text, text) to anon, authenticated;

-- Ficha que ya presentó la Evaluación 1
insert into public.fichas (code, program) values ('3230441', '') on conflict (code) do nothing;

-- Corrige la ficha mal escrita en los resultados existentes (solo cambia group_name)
update public.student_results set group_name = '3230441' where group_name is distinct from '3230441';

commit;
