"use strict";
const { parts, englishKeys, practice, evaluations } = window.TyTContent;
const { normalizeName, flattenEvaluation, scoreAttempt } = window.TyTEngine;

const STORAGE_PROGRESS = "tytPracticeV2";
const STORAGE_FINAL = "tytFinalInProgress";
const STORAGE_SEEN = "tytSeenParts";
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
const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
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
  if (part === 1) return `<p class="prompt">${esc(q.prompt)}</p><p class="label">Elige la palabra. Algunas no se usan.</p>`;
  if (part === 2) return `<div class="sign-stage">${sign(q)}</div><p class="label">¿Dónde verías este aviso?</p>`;
  if (part === 3) return `<div class="chat"><p class="bubble"><span class="who">A</span>${esc(q.a)}</p><p class="bubble me"><span class="who">B</span>…</p></div><p class="label">¿Qué responde B?</p>`;
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
const back = (label, action, extra = "") => `<button class="back" data-action="${action}" ${extra}>${icon("back")} ${label}</button>`;

// ───── vistas ─────
function vHome() {
  const pending = read(STORAGE_FINAL, null);
  const seen = read(STORAGE_SEEN, []);
  const next = [1, 2, 3, 4, 5, 6, 7].find(n => !seen.includes(n));
  const cta = !seen.length ? `<button class="btn" data-action="part" data-p="1">Empezar por la Parte 1 ${icon("arrow")}</button>`
    : next ? `<button class="btn" data-action="part" data-p="${next}">Seguir con la Parte ${next} ${icon("arrow")}</button>`
    : `<button class="btn" data-action="evals">Ir a las evaluaciones ${icon("arrow")}</button>`;
  return `<section class="hero">
    <div class="hero-copy">
      <h1>Aprende el inglés del <span class="hl">Saber TyT</span>, parte por parte.</h1>
      <p class="lead">La prueba tiene 7 partes. Aquí cada una se explica con ejemplos, y al terminar cada bloque presentas una evaluación con tu ficha.</p>
      <div class="row">${cta}${next ? `<button class="link" data-action="evals">Ya estudié, ir a evaluaciones</button>` : ""}</div>
      ${pending ? `<div class="alert warn"><strong>Tienes la evaluación final en curso.</strong> <button class="link" data-action="resume-final">Continuar donde ibas</button></div>` : ""}
    </div>
    <aside class="progress-card" aria-label="Tu avance">
      <div class="pc-head"><h2>Tu avance</h2><span>${seen.length} de 7 partes</span></div>
      <div class="bar"><span style="width:${Math.round(seen.length / 7 * 100)}%"></span></div>
      <ol class="pc-list">${Object.keys(parts).map(Number).map(n => `<li><button data-action="part" data-p="${n}" class="${seen.includes(n) ? "done" : n === next ? "next" : ""}"><span class="dot">${seen.includes(n) ? icon("check") : n}</span>${esc(parts[n].title)}${n === next ? `<em>Sigue aquí</em>` : ""}</button></li>`).join("")}</ol>
      <p class="pc-note">Tu avance se guarda en este dispositivo.</p>
    </aside>
  </section>

  <section class="route">
    <h2>Tu ruta</h2>
    <p class="muted">Estudia las partes en orden. Al final de cada bloque está su evaluación.</p>
    ${BLOCKS.map((b, i) => `<div class="group">
      <h3>Bloque ${i + 1} <span>· ${esc(b.about)}</span></h3>
      <ul class="rows">${b.parts.map(n => `<li><button class="row-link" data-action="part" data-p="${n}"><span class="n">${n}</span><span class="t"><strong>${esc(parts[n].title)}</strong><small>${esc(parts[n].en)}</small></span>${icon("arrow", "go")}</button></li>`).join("")}
        <li><button class="row-link eval" data-action="register" data-ev="${b.ev}"><span class="n">${icon("check")}</span><span class="t"><strong>${esc(evaluations[b.ev].title)}</strong><small>${flattenEvaluation(evaluations[b.ev]).length} preguntas sobre las partes ${b.parts.join(", ")}</small></span>${icon("arrow", "go")}</button></li>
      </ul></div>`).join("")}
    <div class="final">
      <div><h3>Evaluación final</h3><p>Las 7 partes en ${flattenEvaluation(evaluations.final).length} preguntas. Es tu nota definitiva y se presenta una sola vez.</p></div>
      <button class="btn light" data-action="register" data-ev="final">Presentar la final</button>
    </div>
    <p class="aside">${icon("bulb")} Antes de presentar, lee las <button class="link" data-action="keys">claves del inglés</button>: cuándo responder con información y cuándo con Yes o No.</p>
  </section>`;
}

function vPart() {
  const n = state.p, p = parts[n];
  const done = practiceDone()[n] || [];
  const block = BLOCKS.find(b => b.parts.includes(n));
  const endOfBlock = block.parts.at(-1) === n;
  return `<div class="part-nav">${back("Inicio", "home")}<nav class="tabs" aria-label="Partes">${Object.keys(parts).map(k => `<button class="tab" data-action="part" data-p="${k}" ${Number(k) === n ? 'aria-current="page"' : ""} aria-label="Parte ${k}">${k}</button>`).join("")}</nav></div>
  <header class="page-title"><p class="muted">Parte ${n} de 7 · ${esc(p.en)}</p><h1>${esc(p.title)}</h1><p class="lead">${esc(p.summary)}</p></header>
  <section class="doc">
    <h2>Cómo resolverla</h2>
    <ol class="steps">${p.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
    <div class="two">
      <div><h3>Evita estos errores</h3><ul class="list bad">${p.mistakes.map(s => `<li>${icon("x")}<span>${esc(s)}</span></li>`).join("")}</ul></div>
      <div><h3>Recuerda</h3><ul class="list good">${p.keys.map(s => `<li>${icon("check")}<span>${esc(s)}</span></li>`).join("")}</ul></div>
    </div>
    <p class="format"><strong>En la prueba:</strong> ${p.format.map(esc).join(" ")}</p>
  </section>
  <section class="doc">
    <h2>Pruébalo</h2>
    ${p.examples.map((ex, e) => vExample(n, e, ex)).join("")}
    ${n <= 3 ? `<p class="more">¿Quieres más práctica? ${[0, 1].map(s => `<button class="btn sm ${done.includes(s) ? "ghost" : "ghost"}" data-action="practice" data-p="${n}" data-s="${s}">${done.includes(s) ? icon("check") : ""}Ejercicio ${s + 1}</button>`).join(" ")}</p>` : ""}
  </section>
  ${endOfBlock ? `<div class="next-eval"><div><h3>Terminaste el bloque ${BLOCKS.indexOf(block) + 1}</h3><p>Ya puedes presentar la ${esc(evaluations[block.ev].title)} (partes ${block.parts.join(", ")}).</p></div><button class="btn" data-action="register" data-ev="${block.ev}">Presentar ahora ${icon("arrow")}</button></div>` : ""}
  <div class="pager">${n > 1 ? `<button class="btn ghost" data-action="part" data-p="${n - 1}">${icon("back")} Parte ${n - 1}</button>` : "<span></span>"}${n < 7 ? `<button class="btn" data-action="part" data-p="${n + 1}">Parte ${n + 1}: ${esc(parts[n + 1].title)} ${icon("arrow")}</button>` : `<button class="btn" data-action="evals">Ir a las evaluaciones ${icon("arrow")}</button>`}</div>`;
}
function vExample(n, e, ex) {
  const it = flattenEvaluation({ sections: [ex] })[0];
  const k = `${n}-${e}`;
  const pick = lessonPick[k] || {};
  return `<div class="example">${itemPrompt(it)}
    ${optionList(it, pick.chosen ?? null, pick.checked, "ex-pick", k)}
    <div class="row"><button class="btn sm" data-action="ex-check" data-k="${k}">Comprobar</button><button class="link" data-action="ex-hint" data-k="${k}">${pick.hint ? "Ocultar pista" : "Ver una pista"}</button></div>
    ${pick.hint ? `<p class="hint">${icon("bulb")} ${esc(it.q.hint)}</p>` : ""}
    ${pick.checked ? `<div class="alert ${pick.chosen === it.answer ? "ok" : "bad"}"><strong>${pick.chosen === it.answer ? "Correcto" : `Es la ${L(it.answer)}: ${esc(it.options[it.answer])}`}</strong>${esc(it.q.explanation)}</div>` : ""}
  </div>`;
}

function vKeys() {
  return `${back("Inicio", "home")}
  <header class="page-title"><h1>Claves del inglés</h1><p class="lead">Lo que más ayuda en toda la prueba. Empieza por la primera: es la base de la Parte 3.</p></header>
  <div class="compare">
    <div class="cmp"><h3>Empieza con What, Where, When, Who, Why, How</h3><p class="muted">Respondes con <strong>información</strong>.</p><p class="q">Where do you study?</p><p class="ans ok">${icon("check")} At the SENA centre.</p><p class="ans no">${icon("x")} Yes, I do.</p></div>
    <div class="cmp alt"><h3>Empieza con Do, Is, Can, Did, Are, Will</h3><p class="muted">Respondes <strong>Yes o No</strong> + el mismo auxiliar.</p><p class="q">Do you study at SENA?</p><p class="ans ok">${icon("check")} Yes, I do.</p><p class="ans no">${icon("x")} At the SENA centre.</p></div>
  </div>
  ${englishKeys.map(k => `<section class="doc"><h2>${esc(k.title)}</h2><p>${esc(k.intro)}</p>
    ${k.table ? `<div class="table-wrap"><table>${k.table.map(r => `<tr>${r.map((c, j) => j ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join("")}</tr>`).join("")}</table></div>` : ""}
    ${k.list ? `<ul class="list good">${k.list.map(x => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("")}</ul>` : ""}
    ${k.tip ? `<p class="hint">${icon("bulb")} ${esc(k.tip)}</p>` : ""}</section>`).join("")}
  <div class="pager"><span></span><button class="btn" data-action="evals">Ir a las evaluaciones ${icon("arrow")}</button></div>`;
}

function vEvals() {
  return `${back("Inicio", "home")}
  <header class="page-title"><h1>Evaluaciones</h1><p class="lead">Necesitas tu nombre completo y tu ficha. Tu nota llega a tu instructora.</p></header>
  <ul class="rows big">${Object.values(evaluations).map(ev => `<li><button class="row-link ${ev.final ? "eval-final" : ""}" data-action="register" data-ev="${ev.id}">
    <span class="t"><strong>${esc(ev.title)}</strong><small>Partes ${ev.parts.length === 7 ? "1 a 7" : ev.parts.join(", ")} · ${flattenEvaluation(ev).length} preguntas${ev.final ? " · nota definitiva, una sola vez" : ""}</small></span>
    <span class="go-label">Presentar ${icon("arrow")}</span></button></li>`).join("")}</ul>`;
}

function vRegister() {
  const ev = evaluations[state.ev];
  const f = state.fichas;
  return `${back("Evaluaciones", "evals")}
  <section class="narrow"><h1 class="h-md">${esc(ev.title)}</h1><p class="muted">Partes ${ev.parts.length === 7 ? "1 a 7" : ev.parts.join(", ")} · ${flattenEvaluation(ev).length} preguntas</p>
    ${ev.final ? `<div class="alert warn"><strong>Es tu nota definitiva.</strong>Solo puedes presentarla una vez y no verás las respuestas. Si se cierra la página, continúas desde este mismo dispositivo.</div>` : ""}
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
  // Las evaluaciones no traen las respuestas (las califica el servidor): solo la práctica muestra si acertaste
  const feedback = quiz.kind === "practice";
  const pct = Math.round(quiz.index / quiz.items.length * 100);
  const last = quiz.index === quiz.items.length - 1;
  const ok = chosen === it.answer;
  return `<section class="quiz">
    <div class="quiz-top"><span>${esc(quiz.title)} · Parte ${it.part}: ${esc(parts[it.part].title)}</span><span class="clock">${icon("clock")} <span>${fmt(Date.now() - quiz.startedAt)}</span></span></div>
    <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso"><span style="width:${pct}%"></span></div>
    <p class="count">Pregunta ${quiz.index + 1} de ${quiz.items.length}</p>
    ${itemPrompt(it)}${optionList(it, chosen ?? null, feedback, "answer")}
    ${feedback && answered ? `<div class="alert ${ok ? "ok" : "bad"}"><strong>${ok ? "Correcto" : `Era la ${L(it.answer)}: ${esc(it.options[it.answer])}`}</strong>${esc(explanationOf(it.q))}${it.q.clue ? `<small>Pista: ${esc(it.q.clue)}</small>` : ""}</div>` : ""}
    ${quiz.showTip ? `<p class="hint">${icon("bulb")} ${esc(parts[it.part].steps[1])}</p>` : ""}
    <div class="pager">
      ${quiz.kind === "eval" && quiz.index > 0 ? `<button class="btn ghost" data-action="prev">${icon("back")} Anterior</button>` : `<button class="link" data-action="tip">${quiz.showTip ? "Ocultar ayuda" : "¿Cómo se resuelve?"}</button>`}
      <button class="btn" data-action="next" ${answered ? "" : "disabled"}>${last ? "Terminar" : "Siguiente"} ${icon("arrow")}</button></div>
  </section>`;
}

function vPracticeDone() {
  const r = state.r;
  return `<section class="narrow center"><p class="score">${r.correct}<span>/${r.total}</span></p><h1 class="h-md">Ejercicio terminado</h1><p class="muted">Repasa lo que fallaste y vuelve a intentarlo cuando quieras.</p>
    <div class="row center"><button class="btn" data-action="part" data-p="${state.p}">Volver a la Parte ${state.p}</button><button class="link" data-action="evals">Ir a evaluaciones</button></div></section>`;
}

function vResult() {
  const r = state.r;
  const ev = evaluations[r.evaluation];
  const items = flattenEvaluation(ev);
  const head = `<p class="muted">${esc(ev.title)} · Ficha ${esc(r.ficha)}</p><h1 class="h-md">${esc(r.name)}</h1>`;
  if (r.sync !== "sent") return `<section class="result">${head}
    <div class="alert bad"><strong>No se pudo enviar tu evaluación.</strong>${esc(r.syncError || "")} No cierres esta página: revisa tu internet y reintenta.<span class="row"><button class="btn sm" data-action="retry-send">Reintentar envío</button></span></div></section>`;
  return `<section class="result">${head}
    <div class="alert ok"><strong>Resultado enviado.</strong>Tu instructora ya puede verlo.</div>
    <dl class="stats"><div><dt>Nota</dt><dd>${r.percent}%</dd></div><div><dt>Correctas</dt><dd>${r.correct} de ${r.total}</dd></div><div><dt>Tiempo</dt><dd>${fmt(r.duration * 1000)}</dd></div></dl>
    <h2>Por parte</h2><div class="by-part">${Object.entries(r.byPart).map(([p, s]) => `<div><span>Parte ${p} · ${esc(parts[p].title)}</span><div class="bar"><span style="width:${Math.round(100 * s.correct / s.total)}%"></span></div><strong>${s.correct}/${s.total}</strong></div>`).join("")}</div>
    ${!ev.final && r.missed.length ? `<h2>Para repasar</h2><ul class="review">${r.missed.map(m => {
      const it = items.filter(x => x.part === m.part)[m.question - 1];
      return `<li><strong>Parte ${m.part}:</strong> ${esc(it.q.prompt || it.q.message || it.q.a || it.q.q || `Espacio (${it.q.gap})`)}<small>Correcta: ${L(m.answer)}. ${esc(it.options[m.answer])}. ${esc(m.explanation)}</small></li>`;
    }).join("")}</ul>` : ""}
    ${ev.final ? `<p class="muted">En la evaluación final no se muestran las respuestas correctas.</p>` : ""}
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
  const r = {
    evaluation: quiz.evId, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, selections: quiz.selections.slice(),
    name: quiz.student.name, ficha: quiz.student.ficha, duration: Math.round((Date.now() - quiz.startedAt) / 1000)
  };
  await sendResult(r);
  quiz = null;
  go("result", { r });
}
// El servidor califica (submit_evaluation): aquí no hay respuestas correctas que se puedan alterar
async function sendResult(r) {
  try {
    const { data, error } = await db().rpc("submit_evaluation", { p_id: r.id, p_evaluation: r.evaluation, p_name: r.name, p_ficha: r.ficha, p_selections: r.selections, p_duration: r.duration });
    if (error?.code === "23505") { drop(STORAGE_FINAL); throw new Error("Ya hay una evaluación final registrada con tu nombre y ficha."); }
    if (error) throw new Error(error.message);
    Object.assign(r, data, { sync: "sent", syncError: "" });
    // La final en curso se borra solo cuando el servidor la recibió
    if (r.evaluation === "final") { drop(STORAGE_FINAL); save(`tytFinalDone:${r.ficha}:${normalizeName(r.name)}`, true); }
  } catch (e) { r.sync = "failed"; r.syncError = e.message; }
}
async function loadFichas() {
  const ev = state.ev;
  const stillHere = () => state.view === "register" && state.ev === ev;
  try {
    const { data, error } = await db().from("fichas").select("code, program").eq("active", true).order("code");
    if (error) throw new Error(error.message);
    if (stillHere()) { state.fichas = data; render(); }
  } catch (e) { if (stillHere()) { state.fichas = null; state.fichaError = e.message; render(); } }
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
  if (a === "part") {
    const p = Number(b.dataset.p);
    const seen = read(STORAGE_SEEN, []);
    if (!seen.includes(p)) save(STORAGE_SEEN, [...seen, p]);
    lessonPick = {}; return go("part", { p });
  }
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
    if (quiz.kind === "practice" && quiz.selections[quiz.index] != null) return;
    quiz.selections[quiz.index] = Number(b.dataset.i); persistFinal(); return render();
  }
  if (a === "tip") { quiz.showTip = !quiz.showTip; return render(); }
  if (a === "prev") { quiz.index--; persistFinal(); return render(); }
  if (a === "next") {
    if (quiz.index < quiz.items.length - 1) { quiz.index++; quiz.showTip = false; persistFinal(); return go("quiz"); }
    if (quiz.final && !confirm("¿Terminar la evaluación final? No podrás cambiar tus respuestas.")) return;
    return finishQuiz();
  }
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
