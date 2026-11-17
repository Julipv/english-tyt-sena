"use strict";
const app = document.getElementById("admin-app");
const EVALS = { eval1: "Evaluación 1 (P1–P3)", eval2: "Evaluación 2 (P4–P5)", eval3: "Evaluación 3 (P6–P7)", final: "Evaluación final" };
let client = null, records = [], fichas = [], missingMigration = false;
const filters = { ficha: "", evaluation: "", q: "" };

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = s => { const m = Math.floor(s / 60); return m ? `${m} min ${String(s % 60).padStart(2, "0")} s` : `${s} s`; };
let toastTimer;
function notify(msg, error = false) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.toggle("error", error); t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3800);
}

function renderLogin(message = "") {
  app.innerHTML = `<section class="card narrow"><h1>Panel docente</h1><p class="muted">Inicia sesión para ver resultados y administrar fichas.</p>
    ${message ? `<div class="alert bad">${esc(message)}</div>` : ""}
    <form id="admin-login" class="form"><label>Correo electrónico<input name="email" type="email" autocomplete="email" required></label>
      <label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label>
      <button class="btn" type="submit">Entrar →</button></form></section>`;
}

async function fetchAll(table, columns) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from(table).select(columns).order("completed_at", { ascending: false }).range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) return out;
  }
}
async function load() {
  const legacy = await fetchAll("student_results", "id, student_name, group_name, completed_at, score_part1, score_part2, score_part3, total_correct, total_questions, percent, duration_seconds");
  let modern = [];
  missingMigration = false;
  try {
    modern = await fetchAll("assessment_results", "id, evaluation, student_name, ficha, completed_at, scores, total_correct, total_questions, percent, duration_seconds");
    const { data, error } = await client.from("fichas").select("code, program, active, created_at").order("code");
    if (error) throw error;
    fichas = data;
  } catch { missingMigration = true; fichas = []; }
  records = [
    ...legacy.map(r => ({ id: r.id, evaluation: "eval1", name: r.student_name, ficha: r.group_name || "", date: r.completed_at, correct: r.total_correct, total: r.total_questions, percent: r.percent, duration: r.duration_seconds, byPart: { 1: { correct: r.score_part1, total: 5 }, 2: { correct: r.score_part2, total: 5 }, 3: { correct: r.score_part3, total: 5 } } })),
    ...modern.map(r => ({ id: r.id, evaluation: r.evaluation, name: r.student_name, ficha: r.ficha, date: r.completed_at, correct: r.total_correct, total: r.total_questions, percent: r.percent, duration: r.duration_seconds, byPart: r.scores || {} }))
  ].sort((a, b) => b.date.localeCompare(a.date));
}

const EVAL_SHORT = { eval1: "Evaluación 1", eval2: "Evaluación 2", eval3: "Evaluación 3", final: "Final" };
const EVAL_PARTS = { eval1: "Partes 1 a 3", eval2: "Partes 4 y 5", eval3: "Partes 6 y 7", final: "Partes 1 a 7" };
let tab = "results";
const filtered = () => records.filter(r =>
  (!filters.ficha || r.ficha === filters.ficha) && (!filters.evaluation || r.evaluation === filters.evaluation) &&
  (!filters.q || r.name.toLocaleLowerCase("es").includes(filters.q.toLocaleLowerCase("es"))));
const avgOf = rs => rs.length ? Math.round(rs.reduce((s, r) => s + r.percent, 0) / rs.length) : null;

function renderTable() {
  const rows = filtered();
  const avg = avgOf(rows);
  const passed = rows.filter(r => r.percent >= 60).length;
  const where = `${filters.ficha ? `Ficha <strong>${esc(filters.ficha)}</strong>` : "<strong>Todas las fichas</strong>"} · ${filters.evaluation ? `<strong>${EVAL_SHORT[filters.evaluation]}</strong>` : "<strong>todas las evaluaciones</strong>"}`;
  document.getElementById("summary").innerHTML = rows.length
    ? `<p>${where}</p><div class="sum-grid"><div><span>Presentaron</span><strong>${rows.length}</strong></div><div><span>Promedio</span><strong>${avg}%</strong></div><div><span>Aprobaron (60% o más)</span><strong>${passed} de ${rows.length}</strong></div></div>`
    : `<p>${where}</p><p class="muted">Todavía no hay resultados aquí.</p>`;
  const byFicha = records.filter(r => !filters.ficha || r.ficha === filters.ficha);
  document.querySelectorAll("[data-eval-tab]").forEach(b => {
    const k = b.dataset.evalTab;
    b.setAttribute("aria-selected", String(k === filters.evaluation));
    b.querySelector("span").textContent = k ? byFicha.filter(r => r.evaluation === k).length : byFicha.length;
  });
  document.getElementById("results-body").innerHTML = rows.length ? rows.map(r => `<tr>
    <td><strong>${esc(r.name)}</strong><small>${esc(r.ficha ? `Ficha ${r.ficha}` : "Sin ficha")}</small></td>
    <td>${EVAL_SHORT[r.evaluation]}</td>
    <td><span class="grade ${r.percent >= 60 ? "pass" : "fail"}">${r.percent}%</span><small>${r.correct} de ${r.total} correctas</small></td>
    <td class="parts-cell">${Object.entries(r.byPart).map(([p, s]) => `<span title="Parte ${p}">P${p}: ${s.correct}/${s.total}</span>`).join("")}</td>
    <td>${new Date(r.date).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}<small>${fmt(r.duration)}</small></td></tr>`).join("")
    : `<tr><td colspan="5" class="empty">No hay resultados con estos filtros.</td></tr>`;
}

function renderDashboard() {
  const fichaOptions = [...new Set([...fichas.map(f => f.code), ...records.map(r => r.ficha).filter(Boolean)])].sort();
  app.innerHTML = `<header class="admin-head"><h1>Panel docente</h1>
      <div class="row"><button class="btn ghost sm" id="refresh">Actualizar</button><button class="link" id="logout">Cerrar sesión</button></div></header>
    <nav class="admin-tabs" role="tablist"><button role="tab" data-tab="results" aria-selected="${tab === "results"}">Resultados</button><button role="tab" data-tab="fichas" aria-selected="${tab === "fichas"}">Fichas <span>${fichas.length}</span></button></nav>
    ${missingMigration ? `<div class="alert warn"><strong>Falta ejecutar la migración de la base de datos.</strong>Solo se ven los resultados de la Evaluación 1. Ejecuta supabase-migration-2026-11.sql en Supabase.</div>` : ""}
    ${tab === "results" ? `
    <section>
      <div class="filters">
        <label>1. Elige la ficha<select id="f-ficha"><option value="">Todas las fichas</option>${fichaOptions.map(c => `<option ${c === filters.ficha ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
        <label>Buscar aprendiz<input id="f-q" type="search" value="${esc(filters.q)}" placeholder="Escribe un nombre"></label>
      </div>
      <p class="step-label">2. Elige la evaluación</p>
      <div class="eval-tabs" role="tablist">${[["", "Todas"], ...Object.entries(EVAL_SHORT)].map(([k, v]) => `<button role="tab" data-eval-tab="${k}">${v}${k ? `<small>${EVAL_PARTS[k]}</small>` : ""}<span>0</span></button>`).join("")}</div>
      <div class="summary" id="summary"></div>
      <div class="table-head"><h2>Lista de aprendices</h2><button class="btn sm" id="csv">Descargar esta lista (Excel/CSV)</button></div>
      <div class="table-wrap"><table class="results"><thead><tr><th>Aprendiz</th><th>Evaluación</th><th>Nota</th><th>Por parte</th><th>Fecha y tiempo</th></tr></thead><tbody id="results-body"></tbody></table></div>
    </section>` : `
    <section class="fichas">
      <p class="muted">Los aprendices eligen su ficha de esta lista antes de presentar. Solo ven las fichas <strong>activas</strong>. Desactivar una ficha no borra sus resultados.</p>
      ${missingMigration ? "" : `<form id="ficha-form" class="form ficha-form">
        <label>Número de ficha<input name="code" required maxlength="20" inputmode="numeric" placeholder="Ej. 3230441"></label>
        <label>Programa (opcional)<input name="program" maxlength="80" placeholder="Ej. Análisis y desarrollo de software"></label>
        <button class="btn" type="submit">Agregar ficha</button></form>
      <div class="table-wrap"><table><thead><tr><th>Ficha</th><th>Programa</th><th>Resultados</th><th>Estado</th></tr></thead><tbody>
        ${fichas.length ? fichas.map(f => `<tr><td><strong>${esc(f.code)}</strong></td><td>${esc(f.program || "—")}</td><td>${records.filter(r => r.ficha === f.code).length}</td>
          <td><span class="state ${f.active ? "on" : "off"}">${f.active ? "Activa" : "Inactiva"}</span> <button class="link" data-toggle="${esc(f.code)}" data-active="${f.active}">${f.active ? "Desactivar" : "Activar"}</button></td></tr>`).join("") : `<tr><td colspan="4" class="empty">Aún no hay fichas. Agrega la primera arriba.</td></tr>`}
      </tbody></table></div>`}
    </section>`}`;
  if (tab === "results") renderTable();
}

function downloadCsv() {
  const rows = filtered();
  if (!rows.length) return notify("No hay resultados para descargar.", true);
  const cell = v => `"${String(/^[\s]*[=+\-@]/.test(String(v)) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const head = ["ID", "Aprendiz", "Ficha", "Evaluación", "Fecha", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "Correctas", "Total", "Porcentaje", "Tiempo (seg)"];
  const body = rows.map(r => [r.id, r.name, r.ficha, EVALS[r.evaluation], new Date(r.date).toLocaleString("es-CO"),
    ...[1, 2, 3, 4, 5, 6, 7].map(p => r.byPart[p] ? `${r.byPart[p].correct}/${r.byPart[p].total}` : ""), r.correct, r.total, r.percent, r.duration]);
  const url = URL.createObjectURL(new Blob(["﻿" + [head, ...body].map(x => x.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `resultados${filters.ficha ? `-ficha-${filters.ficha}` : ""}${filters.evaluation ? `-${filters.evaluation}` : ""}.csv` });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

async function refresh() {
  try { await load(); renderDashboard(); }
  catch (e) { renderLogin(`No se pudieron leer los resultados: ${e.message}`); }
}

app.addEventListener("input", e => {
  if (e.target.id === "f-q") { filters.q = e.target.value; renderTable(); }
});
app.addEventListener("change", e => {
  if (e.target.id === "f-ficha") { filters.ficha = e.target.value; renderTable(); }
});
app.addEventListener("click", async e => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.id === "refresh") { t.disabled = true; t.textContent = "Actualizando…"; return refresh(); }
  if (t.id === "csv") return downloadCsv();
  if (t.dataset.tab) { tab = t.dataset.tab; return renderDashboard(); }
  if (t.dataset.evalTab !== undefined) { filters.evaluation = t.dataset.evalTab; return renderTable(); }
  if (t.id === "logout") { await client.auth.signOut(); return renderLogin(); }
  if (t.dataset.toggle) {
    t.disabled = true;
    const { error } = await client.from("fichas").update({ active: t.dataset.active !== "true" }).eq("code", t.dataset.toggle);
    if (error) { t.disabled = false; return notify(`No se pudo cambiar la ficha: ${error.message}`, true); }
    return refresh();
  }
});
app.addEventListener("submit", async e => {
  e.preventDefault();
  const data = new FormData(e.target);
  if (e.target.id === "admin-login") {
    if (!client) return renderLogin("La conexión con Supabase no está configurada.");
    const { error } = await client.auth.signInWithPassword({ email: String(data.get("email") || "").trim(), password: String(data.get("password") || "") });
    if (error) return renderLogin("Usuario o contraseña incorrectos.");
    return refresh();
  }
  if (e.target.id === "ficha-form") {
    const code = String(data.get("code") || "").trim();
    if (!code) return notify("Escribe el número de ficha.", true);
    if (fichas.some(f => f.code === code)) return notify("Esa ficha ya existe.", true);
    const { error } = await client.from("fichas").insert({ code, program: String(data.get("program") || "").trim() });
    if (error) return notify(`No se pudo agregar la ficha: ${error.message}`, true);
    notify(`Ficha ${code} agregada.`);
    return refresh();
  }
});

(async function init() {
  const c = window.APP_SUPABASE_CONFIG;
  if (!c?.url || !c?.anonKey || !window.supabase?.createClient) return renderLogin("No se pudo cargar la conexión con Supabase.");
  client = window.supabase.createClient(c.url, c.anonKey);
  const { data } = await client.auth.getSession();
  if (data.session) return refresh();
  renderLogin();
})();
