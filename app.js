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
const pad = n => String(n).padStart(2, "0");
const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5"/>'
};
const icon = (name, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

function sign(q) {
  const tag = q.kind === "warning" ? "Warning" : q.kind === "info" ? "Information" : "Notice";
  return `<figure class="sign sign-${esc(q.kind || "notice")}"><figcaption class="sign-tag">${tag}</figcaption><p class="sign-text">${esc(q.message)}</p></figure>`;
}
function passage(section, gap) {
  const text = esc(section.passage).replace(/\((\d+)\) ___/g, (_, n) => `<mark class="gap${Number(n) === gap ? " on" : ""}">(${n})&nbsp;____</mark>`);
  return `<article class="passage">${section.title ? `<p class="passage-title">${esc(section.title)}</p>` : ""}${text.split("\n\n").map(p => `<p>${p}</p>`).join("")}</article>`;
}
function itemPrompt(it) {
  const { part, q, section } = it;
  if (part === 1) return `<p class="prompt">${esc(q.prompt)}</p><p class="label">Word bank · algunas palabras no se usan</p>`;
  if (part === 2) return `<div class="sign-stage">${sign(q)}</div><p class="label">Where can you see this notice?</p>`;
  if (part === 3) return `<div class="chat"><div class="bubble"><span class="who">A</span>${esc(q.a)}</div><div class="bubble me"><span class="who">B</span>¿…?</div></div><p class="label">Choose the best response</p>`;
  if (part === 4 || part === 7) return `${passage(section, q.gap)}<p class="label">¿Qué palabra va en el espacio (${q.gap})?</p>`;
  return `${passage(section)}<p class="prompt q">${esc(q.q)}</p>`;
}
function optionList(it, chosen, reveal, action, key = "") {
  return `<div class="options ${it.part === 1 ? "bank" : ""}">${it.options.map((o, i) => {
    let cls = chosen === i ? " picked" : "";
    if (reveal && chosen != null) cls = i === it.answer ? " right" : chosen === i ? " wrong" : " dim";
    return `<button class="option${cls}" data-action="${action}" data-i="${i}" ${key ? `data-k="${key}"` : ""} ${reveal && chosen != null ? "disabled" : ""}><span class="key">${L(i)}</span><span>${esc(o)}</span></button>`;
  }).join("")}</div>`;
}
const explanationOf = q => q.explanation || q.feedback || "";
const crumbs = (...items) => `<nav class="crumbs" aria-label="Ruta">${items.map((x, i) => i < items.length - 1 ? `<button class="crumb" data-action="${x[1]}">${x[0]}</button><span aria-hidden="true">/</span>` : `<span>${x[0]}</span>`).join("")}</nav>`;

// ───── vistas ─────
function vHome() {
  const pending = read(STORAGE_FINAL, null);
  const total = Object.values(evaluations).reduce((s, ev) => s + flattenEvaluation(ev).length, 0);
  return `<section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">SENA · Saber TyT · Módulo de inglés</p>
      <h1>Aprende las 7 partes del inglés del <span class="hl">Saber TyT</span></h1>
      <p class="lead">Cada parte explicada con ejemplos para practicar. Cuando termines un bloque, presentas su evaluación con tu ficha.</p>
      <div class="row"><button class="btn" data-action="part" data-p="1">Empezar a estudiar ${icon("arrow")}</button><button class="btn ghost" data-action="evals">Ver evaluaciones</button></div>
      ${pending ? `<div class="alert warn"><strong>Tienes la evaluación final en curso.</strong> <button class="link" data-action="resume-final">Continuar ahora</button></div>` : ""}
      <dl class="facts"><div><dt>Partes</dt><dd>7</dd></div><div><dt>Evaluaciones</dt><dd>4</dd></div><div><dt>Preguntas</dt><dd>${total}</dd></div></dl>
    </div>
    <div class="hero-visual" aria-hidden="true">
      <div class="preview">
        <div class="preview-top"><span class="mono">PARTE 02 · PREGUNTA 3 DE 5</span><span class="mono">${icon("clock")} 02:14</span></div>
        <div class="bar"><span style="width:52%"></span></div>
        <div class="sign-stage small">${sign({ kind: "warning", message: "Please keep your ticket until the end of the journey." })}</div>
        <p class="label">Where can you see this notice?</p>
        <div class="options"><div class="option dim"><span class="key">A</span>Hospital</div><div class="option right"><span class="key">B</span>Train station</div><div class="option dim"><span class="key">C</span>Pharmacy</div></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">Cómo funciona</p><h2>Tres pasos para cada bloque</h2></div>
    <ol class="steps">
      <li><span class="step-n">01</span><h3>Estudia la parte</h3><p>Qué te piden, cómo resolverla y los errores que debes evitar.</p></li>
      <li><span class="step-n">02</span><h3>Resuelve los ejemplos</h3><p>Elige una respuesta, pide una pista y mira la explicación.</p></li>
      <li><span class="step-n">03</span><h3>Presenta la evaluación</h3><p>Escribe tu nombre, elige tu ficha y responde. Tu nota llega a tu instructora.</p></li>
    </ol>
  </section>

  <section class="section">
    <div class="section-head"><p class="eyebrow">Tu ruta</p><h2>Los 3 bloques y la evaluación final</h2></div>
    <div class="route">
      ${BLOCKS.map((b, i) => `<article class="block">
        <p class="mono block-n">BLOQUE ${pad(i + 1)}</p>
        <h3>Partes ${b.parts[0]} a ${b.parts.at(-1)}</h3>
        <p class="muted">${esc(b.about)}</p>
        <ul class="part-list">${b.parts.map(n => `<li><button class="part-row" data-action="part" data-p="${n}"><span class="part-n">${pad(n)}</span><span><strong>${esc(parts[n].title)}</strong><small>${esc(parts[n].en)}</small></span>${icon("arrow", "go")}</button></li>`).join("")}</ul>
        <button class="btn ghost full" data-action="register" data-ev="${b.ev}">Presentar ${esc(evaluations[b.ev].title)}</button>
      </article>`).join("")}
      <article class="block final">
        <p class="mono block-n">FINAL</p>
        <h3>Evaluación final</h3>
        <p>Las 7 partes en ${flattenEvaluation(evaluations.final).length} preguntas. Es tu nota definitiva y se presenta una sola vez.</p>
        <ul class="final-list"><li>${icon("check")} Estudia los 3 bloques antes</li><li>${icon("lock")} Una sola oportunidad</li><li>${icon("clock")} Si se cierra, continúas donde ibas</li></ul>
        <button class="btn light full" data-action="register" data-ev="final">Presentar evaluación final</button>
      </article>
    </div>
  </section>

  <section class="section keys-cta">
    <div><p class="eyebrow">Antes de presentar</p><h2>Claves del inglés</h2><p class="muted">La diferencia más importante: si la pregunta empieza con What, Where o Why, respondes con información. Si empieza con Do, Is o Can, respondes Yes o No.</p>
      <button class="btn ghost" data-action="keys">Ver las claves ${icon("arrow")}</button></div>
    <div class="mini-compare" aria-hidden="true">
      <div><span class="mono">WH</span><p class="q">Where do you study?</p><p class="a">At the SENA centre.</p></div>
      <div><span class="mono">YES / NO</span><p class="q">Do you study at SENA?</p><p class="a">Yes, I do.</p></div>
    </div>
  </section>`;
}

function vPart() {
  const n = state.p, p = parts[n];
  const done = practiceDone()[n] || [];
  const block = BLOCKS.find(b => b.parts.includes(n));
  const endOfBlock = block.parts.at(-1) === n;
  return `${crumbs(["Inicio", "home"], [p.label])}
  <nav class="stepper" aria-label="Partes">${Object.keys(parts).map(k => `<button class="st ${Number(k) < n ? "past" : ""}" data-action="part" data-p="${k}" ${Number(k) === n ? 'aria-current="step"' : ""} aria-label="Parte ${k}"><span>${k}</span></button>`).join('<i aria-hidden="true"></i>')}</nav>
  <header class="part-head"><p class="eyebrow">Parte ${pad(n)} de 07 · ${esc(p.en)}</p><h1>${esc(p.title)}</h1><p class="lead">${esc(p.summary)}</p></header>
  <section class="lesson">
    <article class="card"><p class="mono card-n">A</p><h2>Cómo se ve en la prueba</h2><ul class="list dot">${p.format.map(f => `<li>${esc(f)}</li>`).join("")}</ul></article>
    <article class="card strong"><p class="mono card-n">B</p><h2>Cómo resolverla</h2><ol class="list num">${p.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol></article>
    <article class="card"><p class="mono card-n">C</p><h2>Errores comunes</h2><ul class="list bad">${p.mistakes.map(s => `<li>${icon("x")}<span>${esc(s)}</span></li>`).join("")}</ul></article>
    <article class="card"><p class="mono card-n">D</p><h2>Claves para esta parte</h2><ul class="list good">${p.keys.map(s => `<li>${icon("check")}<span>${esc(s)}</span></li>`).join("")}</ul></article>
  </section>
  <div class="section-head tight"><p class="eyebrow">Practica aquí</p><h2>Ejemplo${p.examples.length > 1 ? "s" : ""} para resolver</h2></div>
  <div class="examples">${p.examples.map((ex, e) => vExample(n, e, ex)).join("")}</div>
  ${n <= 3 ? `<div class="card practice"><div><h3>Más práctica de la parte ${n}</h3><p class="muted">2 ejercicios de 5 preguntas · ${done.length} de 2 completados</p></div><div class="row">${[0, 1].map(s => `<button class="btn ${done.includes(s) ? "ghost" : ""}" data-action="practice" data-p="${n}" data-s="${s}">${done.includes(s) ? icon("check") : ""}Ejercicio ${s + 1}</button>`).join("")}</div></div>` : ""}
  ${endOfBlock ? `<div class="next-eval"><div><p class="eyebrow">Terminaste el bloque ${BLOCKS.indexOf(block) + 1}</p><h3>Ya puedes presentar la ${esc(evaluations[block.ev].title)}</h3><p class="muted">Incluye las partes ${block.parts.join(", ")}.</p></div><button class="btn" data-action="register" data-ev="${block.ev}">Presentar ahora ${icon("arrow")}</button></div>` : ""}
  <div class="pager">${n > 1 ? `<button class="btn ghost" data-action="part" data-p="${n - 1}">${icon("back")} Parte ${n - 1}</button>` : "<span></span>"}${n < 7 ? `<button class="btn" data-action="part" data-p="${n + 1}">Parte ${n + 1} ${icon("arrow")}</button>` : `<button class="btn" data-action="evals">Ver evaluaciones ${icon("arrow")}</button>`}</div>`;
}
function vExample(n, e, ex) {
  const it = flattenEvaluation({ sections: [ex] })[0];
  const k = `${n}-${e}`;
  const pick = lessonPick[k] || {};
  return `<section class="card example"><p class="mono card-n">EJEMPLO ${pad(e + 1)}</p>${itemPrompt(it)}
    ${optionList(it, pick.chosen ?? null, pick.checked, "ex-pick", k)}
    <div class="row"><button class="btn sm" data-action="ex-check" data-k="${k}">Comprobar</button><button class="btn sm ghost" data-action="ex-hint" data-k="${k}">${icon("bulb")} ${pick.hint ? "Ocultar pista" : "Ver pista"}</button></div>
    ${pick.hint ? `<p class="hint">${esc(it.q.hint)}</p>` : ""}
    ${pick.checked ? `<div class="alert ${pick.chosen === it.answer ? "ok" : "bad"}"><strong>${pick.chosen === it.answer ? "Correcto" : `La respuesta es ${L(it.answer)}. ${esc(it.options[it.answer])}`}</strong>${esc(it.q.explanation)}</div>` : ""}
  </section>`;
}

function vKeys() {
  return `${crumbs(["Inicio", "home"], ["Claves del inglés"])}
  <header class="part-head"><p class="eyebrow">Antes de presentar</p><h1>Claves del inglés</h1><p class="lead">Lo que más te ayuda en todas las partes. Empieza por la primera: es la base de la Parte 3.</p></header>
  <div class="compare">
    <div class="cmp"><p class="mono">EMPIEZA CON WHAT · WHERE · WHEN · WHO · WHY · HOW</p><h3>Pregunta WH: respondes con información</h3><p class="q">Where do you study?</p><p class="ans ok">${icon("check")} At the SENA centre.</p><p class="ans no">${icon("x")} Yes, I do.</p></div>
    <div class="cmp alt"><p class="mono">EMPIEZA CON DO · IS · CAN · DID · ARE · WILL</p><h3>Pregunta cerrada: respondes Yes o No</h3><p class="q">Do you study at SENA?</p><p class="ans ok">${icon("check")} Yes, I do.</p><p class="ans no">${icon("x")} At the SENA centre.</p></div>
  </div>
  ${englishKeys.map((k, i) => `<section class="card keyblock"><p class="mono card-n">${pad(i + 1)}</p><h2>${esc(k.title)}</h2><p>${esc(k.intro)}</p>
    ${k.table ? `<div class="table-wrap"><table>${k.table.map(r => `<tr>${r.map((c, j) => j ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join("")}</tr>`).join("")}</table></div>` : ""}
    ${k.list ? `<ul class="list good">${k.list.map(x => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("")}</ul>` : ""}
    ${k.tip ? `<p class="hint">${esc(k.tip)}</p>` : ""}</section>`).join("")}
  <div class="pager"><span></span><button class="btn" data-action="evals">Ver evaluaciones ${icon("arrow")}</button></div>`;
}

function vEvals() {
  return `${crumbs(["Inicio", "home"], ["Evaluaciones"])}
  <header class="part-head"><p class="eyebrow">Tu nota llega a tu instructora</p><h1>Evaluaciones</h1><p class="lead">Necesitas tu nombre completo y tu ficha. Si tu ficha no aparece en la lista, avísale a tu instructora.</p></header>
  <section class="evals">${Object.values(evaluations).map((ev, i) => {
    const n = flattenEvaluation(ev).length;
    return `<article class="eval ${ev.final ? "final" : ""}"><p class="mono block-n">${ev.final ? "FINAL" : `EVALUACIÓN ${pad(i + 1)}`}</p><h3>${esc(ev.title)}</h3>
      <p class="chips">${ev.parts.map(p => `<span class="chip">P${p}</span>`).join("")}</p>
      <dl class="meta"><div><dt>Preguntas</dt><dd>${n}</dd></div><div><dt>Respuestas</dt><dd>${ev.final ? "Ocultas" : "Con explicación"}</dd></div></dl>
      ${ev.final ? `<p class="small">Nota definitiva · una sola oportunidad</p>` : ""}
      <button class="btn ${ev.final ? "light" : ""} full" data-action="register" data-ev="${ev.id}">Presentar</button></article>`;
  }).join("")}</section>`;
}

function vRegister() {
  const ev = evaluations[state.ev];
  const f = state.fichas;
  return `${crumbs(["Evaluaciones", "evals"], [ev.title])}
  <section class="card narrow"><p class="eyebrow">${esc(ev.subtitle)} · ${flattenEvaluation(ev).length} preguntas</p><h1 class="h-md">${esc(ev.title)}</h1>
    ${ev.final ? `<div class="alert warn"><strong>Esta es tu nota definitiva.</strong>Solo puedes presentarla una vez y no verás las respuestas correctas. Si se cierra la página, puedes continuar desde este mismo dispositivo.</div>` : ""}
    <form id="register-form" class="form">
      <label>Nombre completo<input name="name" maxlength="60" required autocomplete="name" placeholder="Ej. Andrea Pérez Gómez"></label>
      <label>Ficha
        ${f === undefined ? `<select disabled><option>Cargando fichas…</option></select>`
        : f === null ? `<div class="alert bad"><strong>No se pudo cargar la lista.</strong>${esc(state.fichaError)} <button type="button" class="link" data-action="register" data-ev="${ev.id}">Reintentar</button></div>`
        : f.length ? `<select name="ficha" required><option value="">Elige tu ficha</option>${f.map(x => `<option value="${esc(x.code)}">${esc(x.code)}${x.program ? ` · ${esc(x.program)}` : ""}</option>`).join("")}</select>`
        : `<div class="alert bad"><strong>Aún no hay fichas.</strong>Tu instructora debe agregarlas primero.</div>`}
      </label>
      <button class="btn full" type="submit" ${f && f.length ? "" : "disabled"}>Empezar ${icon("arrow")}</button>
    </form></section>`;
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
    <div class="quiz-top"><span class="mono">${esc(quiz.title).toUpperCase()} · PARTE ${pad(it.part)}</span><span class="mono clock">${icon("clock")} <span>${fmt(Date.now() - quiz.startedAt)}</span></span></div>
    <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso"><span style="width:${pct}%"></span></div>
    <p class="count">Pregunta ${quiz.index + 1} de ${quiz.items.length} · ${esc(parts[it.part].title)}</p>
    <div class="card quiz-card">${itemPrompt(it)}${optionList(it, chosen ?? null, feedback, "answer")}
      ${feedback && answered ? `<div class="alert ${ok ? "ok" : "bad"}"><strong>${ok ? "Correcto" : `Respuesta correcta: ${L(it.answer)}. ${esc(it.options[it.answer])}`}</strong>${esc(explanationOf(it.q))}${it.q.clue ? `<small>Pista: ${esc(it.q.clue)}</small>` : ""}</div>` : ""}
      ${quiz.showTip ? `<p class="hint">${esc(parts[it.part].steps[1])}</p>` : ""}
      <div class="pager in">
        ${quiz.final && quiz.index > 0 ? `<button class="btn ghost sm" data-action="prev">${icon("back")} Anterior</button>` : `<button class="btn ghost sm" data-action="tip">${icon("bulb")} Estrategia</button>`}
        <button class="btn" data-action="next" ${answered ? "" : "disabled"}>${last ? "Terminar" : "Siguiente"} ${icon("arrow")}</button></div>
    </div></section>`;
}

function vPracticeDone() {
  const r = state.r;
  return `<section class="card narrow center"><p class="score">${r.correct}<span>/${r.total}</span></p><h1 class="h-md">Ejercicio terminado</h1><p class="muted">Repasa las explicaciones de lo que fallaste y vuelve a intentarlo cuando quieras.</p>
    <div class="row center"><button class="btn" data-action="part" data-p="${state.p}">Volver a la parte ${state.p}</button><button class="btn ghost" data-action="evals">Evaluaciones</button></div></section>`;
}

function vResult() {
  const r = state.r;
  const ev = evaluations[r.evaluation];
  const items = flattenEvaluation(ev);
  return `<section class="card result">
    <p class="eyebrow">${esc(ev.title)} · Ficha ${esc(r.ficha)}</p><h1 class="h-md">${esc(r.name)}</h1>
    ${r.sync === "sent" ? `<div class="alert ok"><strong>Resultado enviado.</strong>Tu instructora ya puede verlo.</div>`
      : `<div class="alert bad"><strong>No se pudo enviar tu resultado.</strong>${esc(r.syncError || "")} Descarga el archivo y entrégaselo a tu instructora.<span class="row"><button class="btn sm ghost" data-action="csv">Descargar mi resultado</button><button class="btn sm" data-action="retry-send">Reintentar envío</button></span></div>`}
    <dl class="stats"><div><dt>Nota</dt><dd>${r.percent}%</dd></div><div><dt>Correctas</dt><dd>${r.correct}/${r.total}</dd></div><div><dt>Tiempo</dt><dd>${fmt(r.duration * 1000)}</dd></div></dl>
    <h2>Resultado por parte</h2><div class="by-part">${Object.entries(r.byPart).map(([p, s]) => `<div><span><b>${pad(p)}</b> ${esc(parts[p].title)}</span><div class="bar"><span style="width:${Math.round(100 * s.correct / s.total)}%"></span></div><strong>${s.correct}/${s.total}</strong></div>`).join("")}</div>
    ${!ev.final && r.missed.length ? `<h2>Para repasar</h2><ul class="review">${r.missed.map(m => {
      const it = items.filter(x => x.part === m.part)[m.question - 1];
      return `<li><span class="chip">P${m.part}</span> ${esc(it.q.prompt || it.q.message || it.q.a || it.q.q || `Espacio (${it.q.gap})`)}<small>Correcta: ${L(it.answer)}. ${esc(it.options[it.answer])} — ${esc(explanationOf(it.q))}</small></li>`;
    }).join("")}</ul>` : ""}
    ${ev.final ? `<p class="muted">Esta es tu nota definitiva. En la evaluación final no se muestran las respuestas correctas.</p>` : ""}
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
  if (state.view === "quiz") clockTimer = setInterval(() => { const c = app.querySelector(".clock span"); if (c && quiz) c.textContent = fmt(Date.now() - quiz.startedAt); }, 1000);
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
