"use strict";
const { parts, englishKeys, practice, evaluations } = window.TyTContent;
const { normalizeName, flattenEvaluation, scoreAttempt, legacyPayload, assessmentPayload } = window.TyTEngine;

const STORAGE_RESULTS = "englishChallengeResultsV1";
const STORAGE_PROGRESS = "tytPracticeV2";
const STORAGE_FINAL = "tytFinalInProgress";
const L = i => String.fromCharCode(65 + i);
const BLOCKS = [
  { ev: "eval1", parts: [1, 2, 3], about: "Vocabulario, avisos y conversaciones cortas." },
  { ev: "eval2", parts: [4, 5], about: "Completar textos y comprensión de lectura." },
  { ev: "eval3", parts: [6, 7], about: "Lectura crítica y gramática en contexto." }
];
const app = document.getElementById("app");
let state = { view: "home" };
let quiz = null;
let lessonPick = {};
let clockTimer, toastTimer, client = null;

// ───── utilidades ─────
function esc(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function read(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } }
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch { return false; } }
function drop(key) { try { localStorage.removeItem(key); } catch { /* sin almacenamiento */ } }
function notify(msg, error = false) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.toggle("error", error); t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3800);
}
function fmt(ms) { const s = Math.max(0, Math.floor(ms / 1000)); const m = Math.floor(s / 60); return m ? `${m} min ${String(s % 60).padStart(2, "0")} s` : `${s} s`; }
function go(view, extra = {}) { state = { view, ...extra }; render(); app.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "smooth" }); }
function db() {
  if (client) return client;
  const c = window.APP_SUPABASE_CONFIG;
  if (!c?.url || !c?.anonKey || !window.supabase?.createClient) throw new Error("No se pudo conectar con el sistema de la clase. Revisa tu internet.");
  return (client = window.supabase.createClient(c.url, c.anonKey));
}
const practiceDone = () => read(STORAGE_PROGRESS, {});
function practiceSection(part, set) {
  const p = practice[`part${part}`][set];
  return part === 1 ? { part, bank: p.bank, questions: p.questions } : { part, questions: p };
}

// ───── piezas visuales ─────
function sign(q) {
  return `<figure class="sign sign-${esc(q.kind || "notice")}"><span class="sign-bolt" aria-hidden="true"></span><span class="sign-bolt r" aria-hidden="true"></span>
    <span class="sign-icon" aria-hidden="true">${esc(q.icon || "🪧")}</span><p class="sign-text">${esc(q.message)}</p>
    <figcaption class="sign-tag">${q.kind === "warning" ? "Warning" : q.kind === "info" ? "Information" : "Notice"}</figcaption></figure>`;
}
function passage(section, gap) {
  const text = esc(section.passage).replace(/\((\d+)\) ___/g, (_, n) => `<mark class="gap${Number(n) === gap ? " on" : ""}">(${n})&nbsp;____</mark>`);
  return `<article class="passage">${section.title ? `<h3>${esc(section.title)}</h3>` : ""}${text.split("\n\n").map(p => `<p>${p}</p>`).join("")}</article>`;
}
function itemPrompt(it) {
  const { part, q, section } = it;
  if (part === 1) return `<p class="prompt">${esc(q.prompt)}</p><p class="label">Word bank · algunas palabras no se usan</p>`;
  if (part === 2) return `<div class="sign-stage">${sign(q)}</div><p class="label">Where can you see this notice?</p>`;
  if (part === 3) return `<div class="chat"><div class="bubble"><b>A</b>${esc(q.a)}</div><div class="bubble me"><b>B</b>__________</div></div><p class="label">Choose the best response</p>`;
  if (part === 4 || part === 7) return `${passage(section, q.gap)}<p class="label">¿Qué palabra va en el espacio <strong>(${q.gap})</strong>?</p>`;
  return `${passage(section)}<p class="prompt q">${esc(q.q)}</p>`;
}
function optionList(it, chosen, reveal, action) {
  return `<div class="options ${it.part === 1 ? "bank" : ""}">${it.options.map((o, i) => {
    let cls = chosen === i ? " picked" : "";
    if (reveal && chosen != null) cls = i === it.answer ? " right" : chosen === i ? " wrong" : " dim";
    return `<button class="option${cls}" data-action="${action}" data-i="${i}" ${reveal && chosen != null ? "disabled" : ""}><span class="key">${L(i)}</span><span>${esc(o)}</span></button>`;
  }).join("")}</div>`;
}
const explanationOf = q => q.explanation || q.feedback || "";

// ───── vistas ─────
function vHome() {
  const pending = read(STORAGE_FINAL, null);
  return `<section class="hero">
    <div class="hero-copy"><p class="kicker">SENA · Saber TyT · Módulo de inglés</p>
      <h1>Las <em>7 partes</em> de la prueba, explicadas paso a paso.</h1>
      <p class="lead">Entiende qué te pide cada parte, aprende la estrategia para resolverla, practica y presenta tus evaluaciones con tu ficha.</p>
      <div class="row"><button class="btn" data-action="part" data-p="1">Empezar por la Parte 1 →</button><button class="btn ghost" data-action="evals">Ir a las evaluaciones</button></div>
      ${pending ? `<div class="alert warn"><strong>Tienes la evaluación final en curso.</strong> <button class="link" data-action="resume-final">Continuar ahora →</button></div>` : ""}
    </div>
    <aside class="route"><h2>Tu ruta, paso a paso</h2><ol>
      ${BLOCKS.map((b, i) => `<li><span class="n">${i + 1}</span><span><b>Estudia las partes ${b.parts.join(", ")}</b><small>Luego presenta la ${evaluations[b.ev].title}</small></span></li>`).join("")}
      <li class="fin"><span class="n">★</span><span><b>Evaluación final</b><small>Las 7 partes · nota definitiva · una sola vez</small></span></li>
    </ol></aside>
  </section>
  <section class="steps3">
    <div><span>01</span><h3>Aprende</h3><p>Abre cada parte: qué te piden, cómo resolverla, errores comunes y un ejemplo.</p></div>
    <div><span>02</span><h3>Practica</h3><p>Resuelve los ejemplos y repasa las claves del inglés (WH vs. Yes/No).</p></div>
    <div><span>03</span><h3>Evalúate</h3><p>Elige tu ficha y presenta la evaluación de cada bloque. Al final, la evaluación final.</p></div>
  </section>
  <div class="head"><h2>Las 7 partes</h2><button class="link" data-action="keys">Claves del inglés →</button></div>
  ${BLOCKS.map(b => `<section class="block"><div class="block-head"><div><h3>Bloque ${evaluations[b.ev].title.split(" ")[1]} · Partes ${b.parts.join(", ")}</h3><p>${esc(b.about)}</p></div><button class="btn sm ghost" data-action="register" data-ev="${b.ev}">Presentar ${esc(evaluations[b.ev].title)} →</button></div>
    <div class="parts-grid">${b.parts.map(n => { const p = parts[n]; return `<button class="part-card" data-action="part" data-p="${n}"><span class="num">${n}</span><span class="pc-icon" aria-hidden="true">${p.icon}</span><strong>${esc(p.title)}</strong><small>${esc(p.en)} · ${esc(p.skill)}</small></button>`; }).join("")}</div></section>`).join("")}
  <button class="keys-banner" data-action="keys"><span class="kb-icon" aria-hidden="true">💡</span><span><strong>Claves del inglés</strong><small>Preguntas WH vs. preguntas Yes/No, avisos, gramática y estrategias de lectura.</small></span><span aria-hidden="true">→</span></button>`;
}

function vPart() {
  const n = state.p, p = parts[n];
  const done = practiceDone()[n] || [];
  return `<nav class="crumbs"><button class="link" data-action="home">Inicio</button> / <span>${p.label}</span></nav>
  <header class="part-head"><span class="num big">${n}</span><div><p class="kicker">${p.label} · ${esc(p.en)}</p><h1>${esc(p.title)}</h1><p class="lead">${esc(p.summary)}</p></div></header>
  <div class="part-tabs">${Object.keys(parts).map(k => `<button class="tab" data-action="part" data-p="${k}" ${Number(k) === n ? 'aria-current="page"' : ""}>${k}</button>`).join("")}</div>
  <section class="lesson-grid">
    <article class="card"><h2><span class="ic">📋</span>¿Cómo se ve en la prueba?</h2><ul class="ticks">${p.format.map(f => `<li>${esc(f)}</li>`).join("")}</ul></article>
    <article class="card accent"><h2><span class="ic">🧭</span>Cómo resolverla</h2><ol class="numbered">${p.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol></article>
    <article class="card"><h2><span class="ic">⚠️</span>Errores comunes</h2><ul class="crosses">${p.mistakes.map(s => `<li>${esc(s)}</li>`).join("")}</ul></article>
    <article class="card"><h2><span class="ic">🔑</span>Claves para esta parte</h2><ul class="keys">${p.keys.map(s => `<li>${esc(s)}</li>`).join("")}</ul></article>
  </section>
  <div class="head"><h2>Ejemplo${p.examples.length > 1 ? "s" : ""} para resolver</h2></div>
  ${p.examples.map((ex, e) => vExample(n, e, ex)).join("")}
  <div class="part-foot">
    ${n <= 3 ? `<div class="card practice-card"><div><h3>Practica la ${p.label}</h3><p class="muted">2 ejercicios de 5 preguntas con retroalimentación · ${done.length}/2 completados</p></div><div class="row">${[0, 1].map(s => `<button class="btn ${done.includes(s) ? "ghost" : ""}" data-action="practice" data-p="${n}" data-s="${s}">Ejercicio ${s + 1}${done.includes(s) ? " ✓" : ""}</button>`).join("")}</div></div>` : ""}
    ${(() => { const b = BLOCKS.find(x => x.parts.at(-1) === n); return b ? `<div class="alert ok next-eval"><strong>¡Terminaste el bloque de las partes ${b.parts.join(", ")}!</strong> Cuando te sientas listo, presenta la ${esc(evaluations[b.ev].title)}. <button class="link" data-action="register" data-ev="${b.ev}">Presentar ahora →</button></div>` : ""; })()}
    <div class="row between">${n > 1 ? `<button class="btn ghost" data-action="part" data-p="${n - 1}">← Parte ${n - 1}</button>` : "<span></span>"}${n < 7 ? `<button class="btn" data-action="part" data-p="${n + 1}">Parte ${n + 1} →</button>` : `<button class="btn" data-action="evals">Ir a las evaluaciones →</button>`}</div>
  </div>`;
}
function vExample(n, e, ex) {
  const it = flattenEvaluation({ sections: [ex] })[0];
  const pick = lessonPick[`${n}-${e}`] || {};
  return `<section class="card example"><p class="kicker">Ejemplo ${e + 1}</p>${itemPrompt(it)}
    ${optionList(it, pick.chosen ?? null, pick.checked, "ex-pick")}
    <div class="row"><button class="btn sm ghost" data-action="ex-hint" data-k="${n}-${e}">${pick.hint ? "Ocultar pista" : "Ver pista"}</button><button class="btn sm" data-action="ex-check" data-k="${n}-${e}">Comprobar</button></div>
    ${pick.hint ? `<p class="hint">💡 ${esc(it.q.hint)}</p>` : ""}
    ${pick.checked ? `<div class="alert ${pick.chosen === it.answer ? "ok" : "bad"}"><strong>${pick.chosen === it.answer ? "¡Correcto!" : `La respuesta es ${L(it.answer)}. ${esc(it.options[it.answer])}`}</strong><br>${esc(it.q.explanation)}</div>` : ""}
  </section>`.replace(/data-action="ex-pick"/g, `data-action="ex-pick" data-k="${n}-${e}"`);
}

function vKeys() {
  return `<nav class="crumbs"><button class="link" data-action="home">Inicio</button> / <span>Claves del inglés</span></nav>
  <header class="page-head"><p class="kicker">Antes de presentar</p><h1>Claves del inglés</h1><p class="lead">Lo que más te ayuda a responder bien en todas las partes. Empieza por la diferencia entre preguntas WH y preguntas Yes/No: es la base de la Parte 3.</p></header>
  <div class="compare">
    <div class="cmp wh"><p class="kicker">Empieza con What, Where, When, Who, Why, How…</p><h3>Pregunta WH → respondes con <u>información</u></h3><p class="ex">Where do you study?</p><p class="ans ok">✓ At the SENA centre.</p><p class="ans no">✗ Yes, I do.</p></div>
    <div class="cmp yn"><p class="kicker">Empieza con Do, Is, Can, Did, Are, Will…</p><h3>Pregunta cerrada → respondes <u>Yes / No</u></h3><p class="ex">Do you study at SENA?</p><p class="ans ok">✓ Yes, I do.</p><p class="ans no">✗ At the SENA centre.</p></div>
  </div>
  ${englishKeys.map(k => `<section class="card keyblock"><h2><span class="ic">${k.icon}</span>${esc(k.title)}</h2><p>${esc(k.intro)}</p>
    ${k.table ? `<div class="table-wrap"><table>${k.table.map(r => `<tr>${r.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join("")}</tr>`).join("")}</table></div>` : ""}
    ${k.list ? `<ul class="ticks">${k.list.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${k.tip ? `<p class="hint">💡 ${esc(k.tip)}</p>` : ""}</section>`).join("")}
  <div class="row"><button class="btn" data-action="evals">Ir a las evaluaciones →</button></div>`;
}

function vEvals() {
  return `<nav class="crumbs"><button class="link" data-action="home">Inicio</button> / <span>Evaluaciones</span></nav>
  <header class="page-head"><p class="kicker">Tu resultado llega a tu instructora</p><h1>Evaluaciones</h1><p class="lead">Necesitas tu nombre completo y tu ficha. Elige la ficha de la lista; si no aparece, avísale a tu instructora.</p></header>
  <section class="evals">${Object.values(evaluations).map(ev => {
    const n = flattenEvaluation(ev).length;
    return `<article class="eval-card ${ev.final ? "final" : ""}"><p class="kicker">${ev.final ? "Nota definitiva" : ev.subtitle}</p><h3>${esc(ev.title)}</h3>
      <div class="chips">${ev.parts.map(p => `<span class="chip">P${p}</span>`).join("")}</div>
      <p class="muted">${n} preguntas${ev.final ? " · una sola oportunidad · no verás las respuestas" : " · retroalimentación al responder"}</p>
      <button class="btn ${ev.final ? "" : "ghost"}" data-action="register" data-ev="${ev.id}">${ev.final ? "Presentar evaluación final" : "Presentar"} →</button></article>`;
  }).join("")}</section>`;
}

function vRegister() {
  const ev = evaluations[state.ev];
  const f = state.fichas;
  return `<nav class="crumbs"><button class="link" data-action="evals">Evaluaciones</button> / <span>${esc(ev.title)}</span></nav>
  <section class="card narrow"><p class="kicker">${esc(ev.subtitle)} · ${flattenEvaluation(ev).length} preguntas</p><h1>${esc(ev.title)}</h1>
    ${ev.final ? `<div class="alert warn"><strong>Importante:</strong> esta es la nota definitiva. Solo puedes presentarla una vez y no verás las respuestas correctas. Si se cierra la página, puedes continuar desde este mismo dispositivo.</div>` : ""}
    <form id="register-form" class="form">
      <label>Nombre completo<input name="name" maxlength="60" required autocomplete="name" placeholder="Ej. Andrea Pérez Gómez"></label>
      <label>Ficha
        ${f === undefined ? `<select disabled><option>Cargando fichas…</option></select>`
        : f === null ? `<div class="alert bad">${esc(state.fichaError)} <button type="button" class="link" data-action="register" data-ev="${ev.id}">Reintentar</button></div>`
        : f.length ? `<select name="ficha" required><option value="">Elige tu ficha</option>${f.map(x => `<option value="${esc(x.code)}">${esc(x.code)}${x.program ? ` · ${esc(x.program)}` : ""}</option>`).join("")}</select>`
        : `<div class="alert bad">Tu instructora aún no ha agregado fichas.</div>`}
      </label>
      <button class="btn" type="submit" ${f && f.length ? "" : "disabled"}>Empezar →</button>
    </form></section>`;
}
async function loadFichas() {
  try {
    const { data, error } = await db().from("fichas").select("code, program").eq("active", true).order("code");
    if (error) throw new Error("No se pudo cargar la lista de fichas.");
    if (state.view === "register") { state.fichas = data; render(); }
  } catch (e) { if (state.view === "register") { state.fichas = null; state.fichaError = e.message; render(); } }
}

function vQuiz() {
  const it = quiz.items[quiz.index];
  const chosen = quiz.selections[quiz.index];
  const answered = chosen != null;
  const feedback = !quiz.final;
  const pct = Math.round(quiz.index / quiz.items.length * 100);
  const last = quiz.index === quiz.items.length - 1;
  const ok = chosen === it.answer;
  return `<section class="quiz">
    <div class="quiz-top"><span class="pill">${esc(quiz.title)} · ${parts[it.part].label}</span><span class="clock">⏱ ${fmt(Date.now() - quiz.startedAt)}</span></div>
    <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso"><span style="width:${pct}%"></span></div>
    <p class="count">Pregunta ${quiz.index + 1} de ${quiz.items.length}</p>
    <div class="card quiz-card">${itemPrompt(it)}${optionList(it, chosen ?? null, feedback, "answer")}
      ${feedback && answered ? `<div class="alert ${ok ? "ok" : "bad"}"><strong>${ok ? "¡Muy bien!" : `Respuesta correcta: ${L(it.answer)}. ${esc(it.options[it.answer])}`}</strong><br>${esc(explanationOf(it.q))}${it.q.clue ? `<br><small>Pista: ${esc(it.q.clue)}</small>` : ""}</div>` : ""}
      <div class="row between quiz-actions">
        ${quiz.final && quiz.index > 0 ? `<button class="btn ghost sm" data-action="prev">← Anterior</button>` : `<button class="btn ghost sm" data-action="tip">Ver estrategia</button>`}
        <button class="btn" data-action="next" ${answered ? "" : "disabled"}>${last ? "Terminar →" : "Siguiente →"}</button></div>
      ${quiz.showTip ? `<p class="hint">🧭 ${esc(parts[it.part].steps[1])}</p>` : ""}
    </div></section>`;
}

function vPracticeDone() {
  const r = state.r;
  return `<section class="card narrow center"><div class="badge-big">${r.correct}/${r.total}</div><h1>¡Ejercicio terminado!</h1><p class="lead">Repasa las explicaciones que fallaste y vuelve a intentarlo cuando quieras.</p>
    <div class="row center"><button class="btn" data-action="part" data-p="${state.p}">Volver a la ${parts[state.p].label}</button><button class="btn ghost" data-action="evals">Evaluaciones</button></div></section>`;
}

function vResult() {
  const r = state.r;
  const ev = evaluations[r.evaluation];
  const items = flattenEvaluation(ev);
  return `<section class="card result">
    <p class="kicker">${esc(ev.title)} · Ficha ${esc(r.ficha)}</p><h1>${esc(r.name)}</h1>
    ${r.sync === "sent" ? `<div class="alert ok"><strong>Resultado enviado.</strong> Tu instructora ya puede verlo.</div>`
      : `<div class="alert bad"><strong>No se pudo enviar tu resultado.</strong> ${esc(r.syncError || "")} Descarga el archivo y entrégaselo a tu instructora. <button class="btn sm ghost" data-action="csv">Descargar mi resultado</button> <button class="btn sm" data-action="retry-send">Reintentar envío</button></div>`}
    <div class="stats"><div><span>Nota</span><strong>${r.percent}%</strong></div><div><span>Correctas</span><strong>${r.correct}/${r.total}</strong></div><div><span>Tiempo</span><strong>${fmt(r.duration * 1000)}</strong></div></div>
    <h2>Por parte</h2><div class="by-part">${Object.entries(r.byPart).map(([p, s]) => `<div><span>${parts[p].label} · ${esc(parts[p].title)}</span><div class="bar"><span style="width:${Math.round(100 * s.correct / s.total)}%"></span></div><strong>${s.correct}/${s.total}</strong></div>`).join("")}</div>
    ${!ev.final && r.missed.length ? `<h2>Para repasar</h2><ul class="review">${r.missed.map(m => {
      const it = items.filter(x => x.part === m.part)[m.question - 1];
      return `<li><span class="pill">${parts[m.part].label}</span> ${esc(it.q.prompt || it.q.message || it.q.a || it.q.q || `Espacio (${it.q.gap})`)}<br><small>Correcta: ${L(it.answer)}. ${esc(it.options[it.answer])} — ${esc(explanationOf(it.q))}</small></li>`;
    }).join("")}</ul>` : ""}
    ${ev.final ? `<p class="muted">Esta es tu nota definitiva. Las respuestas correctas no se muestran en la evaluación final.</p>` : ""}
    <div class="row"><button class="btn" data-action="home">Volver al inicio</button></div></section>`;
}

// ───── flujo de quiz ─────
function startQuiz(opts) {
  quiz = { index: 0, selections: [], startedAt: Date.now(), showTip: false, ...opts };
  quiz.items = flattenEvaluation({ sections: quiz.sections });
  go("quiz");
}
function persistFinal() { if (quiz?.final) save(STORAGE_FINAL, { evId: quiz.evId, student: quiz.student, selections: quiz.selections, index: quiz.index, startedAt: quiz.startedAt }); }
function resumeFinal() {
  const s = read(STORAGE_FINAL, null);
  if (!s) return go("evals");
  const ev = evaluations[s.evId];
  quiz = { kind: "eval", evId: s.evId, title: ev.title, final: true, sections: ev.sections, student: s.student, selections: s.selections, index: s.index, startedAt: s.startedAt, showTip: false };
  quiz.items = flattenEvaluation(ev);
  go("quiz");
}
async function finishQuiz() {
  if (quiz.kind === "practice") {
    const sc = scoreAttempt({ sections: quiz.sections }, quiz.selections);
    const d = practiceDone(); d[quiz.part] = [...new Set([...(d[quiz.part] || []), quiz.set])]; save(STORAGE_PROGRESS, d);
    return go("practice-done", { r: sc, p: quiz.part });
  }
  if (quiz.finishing) return;
  quiz.finishing = true;
  const ev = evaluations[quiz.evId];
  const r = {
    ...scoreAttempt(ev, quiz.selections), evaluation: ev.id, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: quiz.student.name, ficha: quiz.student.ficha, date: new Date().toISOString(), duration: Math.round((Date.now() - quiz.startedAt) / 1000)
  };
  const all = read(STORAGE_RESULTS, []); all.push(r); save(STORAGE_RESULTS, all);
  if (ev.final) { drop(STORAGE_FINAL); save(`tytFinalDone:${r.ficha}:${normalizeName(r.name)}`, true); }
  await sendResult(r);
  quiz = null;
  go("result", { r });
}
async function sendResult(r) {
  try {
    const legacy = r.evaluation === "eval1";
    const { error } = await db().from(legacy ? "student_results" : "assessment_results").insert(legacy ? legacyPayload(r, r.ficha) : assessmentPayload(r, r.ficha));
    if (error && error.code !== "23505") throw new Error(error.message);
    if (error) { r.sync = "failed"; r.syncError = "Ya hay una evaluación final registrada con tu nombre y ficha."; return; }
    r.sync = "sent"; r.syncError = "";
  } catch (e) { r.sync = "failed"; r.syncError = e.message; }
}
function downloadCsv(r) {
  const cell = v => `"${String(/^[\s]*[=+\-@]/.test(String(v)) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const rows = [["ID", "Evaluación", "Nombre", "Ficha", "Fecha", "Correctas", "Total", "Porcentaje", "Tiempo (seg)"], [r.id, r.evaluation, r.name, r.ficha, r.date, r.correct, r.total, r.percent, r.duration]];
  const url = URL.createObjectURL(new Blob(["﻿" + rows.map(x => x.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `resultado-${r.evaluation}-${normalizeName(r.name).replace(/ /g, "-")}.csv` });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// ───── render y eventos ─────
const views = { home: vHome, part: vPart, keys: vKeys, evals: vEvals, register: vRegister, quiz: vQuiz, "practice-done": vPracticeDone, result: vResult };
function render() {
  app.innerHTML = views[state.view]();
  document.querySelectorAll("[data-nav]").forEach(b => b.toggleAttribute("aria-current", b.dataset.nav === state.view || (b.dataset.nav === "evals" && state.view === "register")));
  clearTimeout(clockTimer);
  if (state.view === "quiz") clockTimer = setInterval(() => { const c = app.querySelector(".clock"); if (c && quiz) c.textContent = `⏱ ${fmt(Date.now() - quiz.startedAt)}`; }, 1000);
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action;
  if (a === "home" || a === "keys" || a === "evals") return go(a);
  if (a === "part") { lessonPick = {}; return go("part", { p: Number(b.dataset.p) }); }
  if (a === "practice") {
    const part = Number(b.dataset.p), set = Number(b.dataset.s);
    return startQuiz({ kind: "practice", part, set, title: `Práctica ${set + 1}`, sections: [practiceSection(part, set)] });
  }
  if (a === "register") {
    const ev = evaluations[b.dataset.ev];
    if (ev.final && read(STORAGE_FINAL, null)) return resumeFinal();
    go("register", { ev: ev.id, fichas: undefined }); return loadFichas();
  }
  if (a === "resume-final") return resumeFinal();
  if (a === "ex-pick" || a === "ex-hint" || a === "ex-check") {
    const k = b.dataset.k, cur = lessonPick[k] || (lessonPick[k] = {});
    if (a === "ex-pick") { cur.chosen = Number(b.dataset.i); cur.checked = false; }
    if (a === "ex-hint") cur.hint = !cur.hint;
    if (a === "ex-check") { if (cur.chosen == null) return notify("Elige una opción primero."); cur.checked = true; }
    const y = window.scrollY; render(); window.scrollTo(0, y); return;
  }
  if (!quiz && ["answer", "next", "prev", "tip"].includes(a)) return;
  if (a === "answer") {
    if (!quiz.final && quiz.selections[quiz.index] != null) return;
    quiz.selections[quiz.index] = Number(b.dataset.i); persistFinal(); return render();
  }
  if (a === "tip") { quiz.showTip = !quiz.showTip; return render(); }
  if (a === "prev") { quiz.index--; persistFinal(); return render(); }
  if (a === "next") {
    if (quiz.index < quiz.items.length - 1) { quiz.index++; quiz.showTip = false; persistFinal(); return go("quiz"); }
    if (quiz.final && !confirm("¿Terminar la evaluación final? No podrás cambiar tus respuestas.")) return;
    return finishQuiz();
  }
  if (a === "csv" && state.r) return downloadCsv(state.r);
  if (a === "retry-send" && state.r) { b.disabled = true; sendResult(state.r).then(render); }
});

app.addEventListener("submit", async e => {
  if (e.target.id !== "register-form") return;
  e.preventDefault();
  const data = new FormData(e.target);
  const name = String(data.get("name") || "").trim().replace(/\s+/g, " ");
  const ficha = String(data.get("ficha") || "");
  if (name.length < 3 || !ficha) return notify("Escribe tu nombre completo y elige tu ficha.", true);
  const ev = evaluations[state.ev];
  if (ev.final) {
    const key = normalizeName(name);
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Verificando…";
    let taken = read(`tytFinalDone:${ficha}:${key}`, false);
    if (!taken) {
      try {
        const { data: t, error } = await db().rpc("final_already_taken", { p_ficha: ficha, p_key: key });
        if (error) throw error;
        taken = t;
      } catch { btn.disabled = false; btn.textContent = "Empezar →"; return notify("No se pudo verificar tu evaluación final. Revisa tu internet e inténtalo de nuevo.", true); }
    }
    if (taken) { btn.disabled = false; btn.textContent = "Empezar →"; return notify("Ya presentaste la evaluación final con este nombre y ficha.", true); }
  }
  startQuiz({ kind: "eval", evId: ev.id, title: ev.title, final: ev.final, sections: ev.sections, student: { name, ficha } });
  persistFinal();
});

window.addEventListener("beforeunload", e => { if (state.view === "quiz" && quiz?.kind === "eval" && !quiz.final) e.preventDefault(); });
render();
