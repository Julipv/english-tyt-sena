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
  app.innerHTML = `<section class="card narrow"><p class="kicker">Acceso autorizado</p><h1>Panel docente</h1><p class="muted">Inicia sesión para ver resultados y administrar fichas.</p>
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

const filtered = () => records.filter(r =>
  (!filters.ficha || r.ficha === filters.ficha) && (!filters.evaluation || r.evaluation === filters.evaluation) &&
  (!filters.q || r.name.toLocaleLowerCase("es").includes(filters.q.toLocaleLowerCase("es"))));

function renderTable() {
  const rows = filtered();
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length) : null;
  document.getElementById("stats").innerHTML = `<div><span>Evaluaciones</span><strong>${rows.length}</strong></div><div><span>Promedio</span><strong>${avg === null ? "—" : `${avg}%`}</strong></div><div><span>Aprendices</span><strong>${new Set(rows.map(r => r.name.toLowerCase())).size}</strong></div>`;
  // Promedio por evaluación para la ficha elegida (ignora el filtro de evaluación)
  const byFicha = records.filter(r => !filters.ficha || r.ficha === filters.ficha);
  document.getElementById("eval-avgs").innerHTML = Object.entries(EVALS).map(([k, v]) => {
    const rs = byFicha.filter(r => r.evaluation === k);
    return `<div><span>${v}</span><strong>${rs.length ? `${Math.round(rs.reduce((s, r) => s + r.percent, 0) / rs.length)}%` : "—"}</strong><span>${rs.length} presentada${rs.length === 1 ? "" : "s"}${filters.ficha ? ` · ficha ${esc(filters.ficha)}` : ""}</span></div>`;
  }).join("");
  document.getElementById("results-body").innerHTML = rows.length ? rows.map(r => `<tr>
    <td><strong>${esc(r.name)}</strong></td><td>${esc(r.ficha || "—")}</td><td>${esc(EVALS[r.evaluation])}</td>
    <td>${new Date(r.date).toLocaleString("es-CO")}</td>
    <td>${Object.entries(r.byPart).map(([p, s]) => `<span class="chip" style="margin:1px">P${p} ${s.correct}/${s.total}</span>`).join(" ")}</td>
    <td><strong>${r.correct}/${r.total} · ${r.percent}%</strong></td><td>${fmt(r.duration)}</td></tr>`).join("")
    : `<tr><td colspan="7">No hay resultados con estos filtros.</td></tr>`;
}

function renderDashboard() {
  const fichaOptions = [...new Set([...fichas.map(f => f.code), ...records.map(r => r.ficha).filter(Boolean)])].sort();
  app.innerHTML = `<header class="page-head row between" style="align-items:flex-end"><div><p class="kicker">Panel privado</p><h1>Resultados</h1></div>
      <div class="row" style="margin:0"><button class="btn ghost sm" id="refresh">Actualizar</button><button class="btn sm" id="csv">Descargar CSV</button><button class="btn ghost sm" id="logout">Cerrar sesión</button></div></header>
    <div class="help"><div><b>1 · Fichas</b>Agrega abajo las fichas que vas a evaluar. Los aprendices solo verán las activas.</div><div><b>2 · Filtra</b>Elige una ficha y una evaluación para ver solo esos resultados.</div><div><b>3 · Descarga</b>“Descargar CSV” baja exactamente lo que estás viendo.</div></div>
    <div class="stats" id="eval-avgs"></div>
    ${missingMigration ? `<div class="alert warn"><strong>Falta ejecutar la migración de la base de datos.</strong> Mientras tanto solo se ven los resultados de la Evaluación 1 y no se pueden administrar fichas. Ejecuta <code>supabase-migration-2026-11.sql</code> en Supabase.</div>` : ""}
    <section class="card" style="margin-bottom:16px">
      <div class="form" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin:0">
        <label>Ficha<select id="f-ficha"><option value="">Todas</option>${fichaOptions.map(c => `<option ${c === filters.ficha ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
        <label>Evaluación<select id="f-eval"><option value="">Todas</option>${Object.entries(EVALS).map(([k, v]) => `<option value="${k}" ${k === filters.evaluation ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label>Buscar aprendiz<input id="f-q" type="search" value="${esc(filters.q)}" placeholder="Nombre"></label>
      </div>
      <div class="stats" id="stats"></div>
      <div class="table-wrap"><table><thead><tr><th>Aprendiz</th><th>Ficha</th><th>Evaluación</th><th>Fecha</th><th>Por parte</th><th>Nota</th><th>Tiempo</th></tr></thead><tbody id="results-body"></tbody></table></div>
    </section>
    <section class="card"><h2><span class="ic">🗂️</span>Fichas</h2><p class="muted">Los aprendices solo pueden elegir las fichas activas. Desactiva una ficha cuando termine su proceso; sus resultados se conservan.</p>
      ${missingMigration ? "" : `<form id="ficha-form" class="form ficha-form">
        <label>Número de ficha<input name="code" required maxlength="20" inputmode="numeric" placeholder="3230441"></label>
        <label>Programa (opcional)<input name="program" maxlength="80" placeholder="Ej. Análisis y desarrollo de software"></label>
        <button class="btn" type="submit">Agregar</button></form>
      <div class="table-wrap" style="margin-top:16px"><table><thead><tr><th>Ficha</th><th>Programa</th><th>Resultados</th><th>Estado</th></tr></thead><tbody>
        ${fichas.length ? fichas.map(f => `<tr><td><strong>${esc(f.code)}</strong></td><td>${esc(f.program || "—")}</td><td>${records.filter(r => r.ficha === f.code).length}</td>
          <td><button class="btn sm ${f.active ? "ghost" : ""}" data-toggle="${esc(f.code)}" data-active="${f.active}">${f.active ? "Activa · desactivar" : "Inactiva · activar"}</button></td></tr>`).join("") : `<tr><td colspan="4">Aún no hay fichas.</td></tr>`}
      </tbody></table></div>`}
    </section>`;
  renderTable();
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
  if (e.target.id === "f-eval") { filters.evaluation = e.target.value; renderTable(); }
});
app.addEventListener("click", async e => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.id === "refresh") { t.disabled = true; t.textContent = "Actualizando…"; return refresh(); }
  if (t.id === "csv") return downloadCsv();
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
