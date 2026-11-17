# Saber TyT Inglés – 7 partes · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sitio estático para aprendices SENA con lecciones de las 7 partes, claves del inglés, 4 evaluaciones por ficha y panel docente con gestión de fichas.

**Architecture:** HTML/CSS/JS sin build (Netlify arrastrar carpeta). Contenido en `content.js`, lógica pura y testeable en `engine.js` (también exportada a Node), UI en `app.js`. Supabase: tabla existente `student_results` intacta para Evaluación 1; tablas nuevas `fichas` y `assessment_results`; RPC `final_already_taken`.

**Tech Stack:** JS (ES2020) navegador, `@supabase/supabase-js@2.45.4` desde jsDelivr, Google Fonts, `node --test` para pruebas.

**Spec:** `docs/2026-11-17-saber-tyt-7-partes-design.md`

## Global Constraints
- NO publicar en Netlify ni ejecutar SQL en Supabase. Solo archivos locales.
- Evaluación 1: mismas 15 preguntas, mismo orden de opciones (incluido `varyPlaceAnswers` con `[3,0,2,1,3]`), sigue insertando en `student_results` con las mismas columnas.
- Conteos: Eval 1 = 15 (5/5/5), Eval 2 = 12 (P4 6, P5 6), Eval 3 = 12 (P6 6, P7 6), Final = 28 (4 por parte).
- Opciones: P1 banco de 8; P2 (nuevas) A/B/C; P3 A/B/C; P4 A/B/C; P5 A/B/C; P6 A/B/C/D; P7 A/B/C/D.
- Preguntas nuevas originales (no copiar el cuadernillo ICFES).
- Final: una vez por ficha + nombre normalizado; sin mostrar respuestas correctas.
- Ficha existente: `3230441`. Correo admin: `vasquezjuli310@gmail.com`.
- Proyecto sin git: los pasos "commit" se omiten.

## Review Focus
1. Aprendiz sin conexión al terminar → no pierde el resultado: copia local + botón CSV (como hoy).
2. Lista de fichas vacía o Supabase caído en el registro → mensaje claro, no se puede empezar sin ficha.
3. Recargar la página a mitad de la final → al volver, la final no permite empezar de nuevo si ya se envió; si no se envió, puede empezar (el bloqueo es por envío). Test: `finalLockKey` + RPC.
4. Nombres con tildes/mayúsculas/espacios dobles ("  José  PÉREZ") → misma clave que "jose perez". Test en engine.
5. Panel con resultados viejos (group_name variado antes de la migración) → se muestran igual, filtro por ficha funciona con cualquier texto.

---

### Task 1: Fixture de la Evaluación 1 original
**Files:** Create `tests/fixtures/eval1.json`, `tests/extract-eval1.mjs`
- [ ] Script que lee `script.js` líneas 1–115 (hasta `varyPlaceAnswers(evaluation.part2, ...)`), lo ejecuta en `node:vm` y escribe `JSON.stringify(evaluation)` al fixture.
- [ ] Run: `node tests/extract-eval1.mjs` → fixture con `part1.questions.length === 5`, `part2.length === 5`, `part3.length === 5`.

### Task 2: `engine.js` (lógica pura)
**Files:** Create `engine.js`, `tests/engine.test.js`

**Produces (window.TyTEngine y module.exports):**
- `normalizeName(name: string): string` → minúsculas, sin tildes (NFD + quitar diacríticos), espacios colapsados, trim.
- `flattenEvaluation(ev): Item[]` → `Item = {part:number, section:object, q:object, options:string[], answer:number}`. Para P1, `options = section.bank`, `answer = bank.indexOf(q.answer)`.
- `scoreAttempt(ev, selections:number[]): {correct, total, percent, byPart:{[part]:{correct,total}}, missed:[{part, question}]}`; `percent = Math.round(100*correct/total)`.
- `legacyPayload(result, ficha)` → objeto exacto de columnas de `student_results` (ver `sendResultToSupabase` actual).
- `assessmentPayload(result, ficha)` → columnas de `assessment_results` (Task 4).

- [ ] Tests: `normalizeName("  José  PÉREZ ") === "jose perez"`; flatten de eval1 (fixture) da 15 items y `answer` ≥ 0 en todos; `scoreAttempt` con todas correctas → 100, todas en -1 → 0 y 15 missed; byPart suma = correct; `legacyPayload` cumple las restricciones SQL (total 15, percent = round, partes ≤ 5).
- [ ] Run `node --test tests/` → FAIL, implementar, → PASS.

### Task 3: `content.js` (contenido)
**Files:** Create `content.js`; Test `tests/content.test.js`

**Produces (window.TyTContent):** `parts` (1–7: `{label, title, icon, summary, steps[], mistakes[], tips[], examples[]}`), `englishKeys` (secciones de claves del inglés), `practice` (P1–P3 actual copiado tal cual), `evaluations` = `{eval1, eval2, eval3, final}` cada uno `{id, title, parts:number[], final:boolean, sections:[{part, passage?, bank?, questions[]}]}`.
- eval1 se arma desde los mismos datos actuales (copiados de `script.js` + `varyPlaceAnswers`).
- Claves del inglés: WH (what/where/when/who/why/how/which/whose/how much/how many → respuesta con información, tabla pregunta→tipo de respuesta), preguntas cerradas (Do/Does/Did, Is/Are/Was/Were, Can/Could, Will, Have/Has → "Yes, I do / No, it isn't", el auxiliar se repite), solicitudes y ofrecimientos, avisos (verbos imperativos: keep, do not, please, must), lectura (palabras de conexión: but, because, although, however), gramática (presente/pasado, artículos, preposiciones, pronombres relativos who/which/where).
- [ ] Tests: `flattenEvaluation(evaluations.eval1)` deep-equals el fixture convertido (mismos prompts, opciones y respuestas en orden); conteos 15/12/12/28; por parte en la final = 4; cada item tiene options del tamaño de la Global Constraint y `answer` válido; P4/P7 cada pregunta referencia un hueco `(n)` presente en el passage.
- [ ] Run `node --test tests/` → PASS.

### Task 4: Migración SQL
**Files:** Create `supabase-migration-2026-11.sql`; Modify `supabase-schema.sql` (agregar las mismas tablas para instalaciones nuevas), `SUPABASE_SETUP.md`.
- [ ] En `begin; … commit;`:
  - `create or replace function public.is_tyt_admin()` (security definer, compara `auth.jwt()->>'email'` con el correo admin).
  - `fichas(code text pk check char_length 1..20, program text default '', active boolean default true, created_at timestamptz default now())`; RLS: anon+authenticated select donde `active`; admin select todo / insert / update.
  - `assessment_results(id text pk, evaluation text check in ('eval2','eval3','final'), student_name text 1..60, student_key text 1..60, ficha text references fichas(code), completed_at, scores jsonb, total_correct int, total_questions int check in (12,28), percent int, duration_seconds int ≥0, missed jsonb, created_at)` + check `percent = round(100.0*total_correct/total_questions)`; unique index `(ficha, student_key) where evaluation='final'`. RLS: anon insert; admin select.
  - `final_already_taken(p_ficha text, p_key text) returns boolean` security definer, grant execute a anon.
  - `insert into fichas(code, program) values ('3230441','') on conflict do nothing;`
  - `update student_results set group_name = '3230441';` (autorizado por la profesora) precedido de un `select group_name, count(*) … group by` comentado para revisar antes.
- [ ] Verificación: revisar a mano que ningún `drop table`/`delete`/`alter … drop` toque `student_results`. `grep -i "drop\|delete\|truncate"` solo debe encontrar `drop policy if exists` de tablas nuevas.

### Task 5: Diseño visual + `index.html` + `style.css`
**Files:** Rewrite `style.css`, `index.html` (cargar `content.js`, `engine.js`, `app.js`; supabase-js versión fija).
- [ ] Invocar skill de diseño (impeccable) antes de escribir CSS. Tokens en `:root`, modo oscuro con `prefers-color-scheme`, verde SENA `#39A900` como acento, Google Font, móvil primero (16px de margen, sin scroll horizontal), foco visible, `prefers-reduced-motion`.
- [ ] Componente cartel (`.sign`): placa con borde, esquinas, ícono, texto en mayúsculas tipo señalización, variantes notice/warning/info.

### Task 6: `app.js` (UI estudiantes)
**Files:** Create `app.js`; Delete `script.js` al final (queda respaldo en `legacy/script.js`).

**Consumes:** TyTContent, TyTEngine, `window.APP_SUPABASE_CONFIG`.
Vistas: inicio · mapa de 7 partes · lección de una parte (concepto → cómo resolver → errores comunes → ejemplo interactivo) · claves del inglés · práctica (P1–P3, como hoy) · evaluaciones (lista de 4) · registro (nombre + `<select>` de fichas activas desde Supabase) · quiz · resultado.
- [ ] Registro: carga fichas; si falla o no hay fichas → mensaje y botón "Reintentar", submit deshabilitado.
- [ ] Final: antes de empezar llama `final_already_taken`; también `localStorage` `tytFinalDone:<ficha>:<key>`. En el quiz de la final no se muestra feedback de correcto/incorrecto; el resultado muestra nota y tiempo, sin explicaciones.
- [ ] Eval 1 inserta con `legacyPayload` en `student_results`; Eval 2/3/final con `assessmentPayload` en `assessment_results`. Error de unique (código `23505`) → "Ya presentaste la evaluación final".
- [ ] Copia local + CSV si el envío falla (como hoy).
- [ ] Verificación: servidor local (`npx http-server -p 5173`), recorrer en navegador: lección de cada parte, claves del inglés, eval 1 completa (Supabase sin ficha nueva fallará: esperado hasta la migración; confirmar el mensaje y el CSV).

### Task 7: Panel docente
**Files:** Modify `admin.html`, `admin.js`
- [ ] Sección "Fichas": lista, agregar (código + programa), activar/desactivar.
- [ ] Resultados: unir `student_results` (como `evaluation: 'eval1'`, ficha = `group_name`) y `assessment_results`; filtros ficha y evaluación; promedio del filtro; tabla con nota por parte; CSV del filtro.
- [ ] Si `assessment_results`/`fichas` no existen todavía (antes de la migración) → mostrar resultados viejos y aviso "Falta ejecutar la migración".
- [ ] Verificación: abrir `admin.html` local, login carga sin errores de consola.

### Task 8: Revisión final
- [ ] `node --test tests/` PASS. Revisar consola sin errores en index y admin. Revisión de diseño con el skill de diseño. Resumen a la profesora con pasos de publicación (SQL primero, luego subir carpeta) — sin ejecutarlos.
