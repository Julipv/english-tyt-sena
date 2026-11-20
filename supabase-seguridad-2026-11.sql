-- Seguridad · noviembre 2026
-- Antes: el navegador calculaba la nota y la insertaba directo en la tabla, así que cualquiera
-- podía enviar la nota que quisiera desde la consola (Inspeccionar).
-- Ahora: el navegador solo envía las respuestas elegidas; el servidor califica con las claves
-- guardadas en answer_keys (que los aprendices no pueden leer) y guarda el resultado.
-- NO BORRA resultados. Requiere haber ejecutado antes supabase-migration-2026-11.sql.
-- Orden: 1) este archivo  2) supabase-claves.sql (lo genera `node tools/publicar.js`).

begin;

create table if not exists public.answer_keys (
  evaluation text primary key check (evaluation in ('eval1', 'eval2', 'eval3', 'final')),
  items jsonb not null -- [{ part, answer, explanation }] en el orden de las preguntas
);
alter table public.answer_keys enable row level security;
revoke all on table public.answer_keys from anon, authenticated;
grant select on table public.answer_keys to authenticated;
drop policy if exists "Admins can read answer keys" on public.answer_keys;
create policy "Admins can read answer keys" on public.answer_keys
  for select to authenticated using (public.is_tyt_admin());

-- Se cierra la inserción directa: solo se puede guardar a través de submit_evaluation.
drop policy if exists "Anyone can submit an assessment result" on public.student_results;
drop policy if exists "Anyone can submit assessment" on public.assessment_results;
revoke insert on table public.student_results from anon, authenticated;
revoke insert on table public.assessment_results from anon, authenticated;

create or replace function public.submit_evaluation(
  p_id text, p_evaluation text, p_name text, p_ficha text, p_selections int[], p_duration int
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_items jsonb; v_item jsonb; v_part text; v_q int; v_ok boolean;
  v_name text; v_key text; v_total int; v_correct int := 0; v_pct int; v_dur int;
  v_by jsonb := '{}'; v_missed jsonb := '[]'; v_review jsonb := '[]';
begin
  select items into v_items from answer_keys where evaluation = p_evaluation;
  if v_items is null then raise exception 'Evaluación no válida'; end if;
  if p_id is null or char_length(p_id) not between 1 and 80 then raise exception 'Identificador no válido'; end if;
  v_name := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  if char_length(v_name) not between 3 and 60 then raise exception 'Nombre no válido'; end if;
  if not exists (select 1 from fichas where code = p_ficha and active) then raise exception 'La ficha no está activa'; end if;
  v_total := jsonb_array_length(v_items);
  if p_selections is null or cardinality(p_selections) <> v_total then raise exception 'Faltan respuestas'; end if;
  v_dur := least(greatest(coalesce(p_duration, 0), 0), 86400);
  -- Igual que normalizeName() de engine.js para las tildes del español
  v_key := translate(lower(v_name), 'áàäâéèëêíìïîóòöôúùüûñç', 'aaaaeeeeiiiioooouuuunc');

  for i in 0 .. v_total - 1 loop
    v_item := v_items -> i;
    v_part := v_item ->> 'part';
    v_q := coalesce((v_by -> v_part ->> 'total')::int, 0) + 1;
    v_ok := p_selections[i + 1] is not distinct from (v_item ->> 'answer')::int;
    v_by := jsonb_set(v_by, array[v_part], jsonb_build_object(
      'correct', coalesce((v_by -> v_part ->> 'correct')::int, 0) + v_ok::int, 'total', v_q));
    if v_ok then v_correct := v_correct + 1;
    else
      v_missed := v_missed || jsonb_build_object('part', v_part::int, 'question', v_q);
      v_review := v_review || jsonb_build_object('part', v_part::int, 'question', v_q,
        'answer', v_item -> 'answer', 'explanation', v_item -> 'explanation');
    end if;
  end loop;
  v_pct := round(100.0 * v_correct / v_total);

  if p_evaluation = 'eval1' then
    insert into student_results (id, student_name, group_name, completed_at, score_part1, score_part2, score_part3,
      total_correct, total_questions, percent, duration_seconds, missed)
    values (p_id, v_name, p_ficha, now(), (v_by -> '1' ->> 'correct')::int, (v_by -> '2' ->> 'correct')::int,
      (v_by -> '3' ->> 'correct')::int, v_correct, v_total, v_pct, v_dur,
      (select coalesce(jsonb_agg(jsonb_build_object('module', 'part' || (m ->> 'part'), 'question', (m ->> 'question')::int)), '[]')
         from jsonb_array_elements(v_missed) m))
    on conflict (id) do nothing;
  else
    -- La final repetida choca con assessment_final_once (error 23505)
    insert into assessment_results (id, evaluation, student_name, student_key, ficha, completed_at, scores,
      total_correct, total_questions, percent, duration_seconds, missed)
    values (p_id, p_evaluation, v_name, v_key, p_ficha, now(), v_by, v_correct, v_total, v_pct, v_dur, v_missed)
    on conflict (id) do nothing;
  end if;

  -- En la final no se devuelven las respuestas correctas
  return jsonb_build_object('correct', v_correct, 'total', v_total, 'percent', v_pct, 'byPart', v_by,
    'missed', case when p_evaluation = 'final' then v_missed else v_review end);
end;
$$;
revoke all on function public.submit_evaluation(text, text, text, text, int[], int) from public;
grant execute on function public.submit_evaluation(text, text, text, text, int[], int) to anon, authenticated;

commit;
