"use strict";

const app = document.getElementById("admin-app");
const modules = {
  part1: { label: "PART 1" },
  part2: { label: "PART 2" },
  part3: { label: "PART 3" }
};
let client = null;
let records = [];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
function showMessage(message, error = false) {
  const element = document.getElementById("admin-message");
  if (!element) return;
  element.textContent = message;
  element.className = error ? "feedback bad" : "feedback good";
  element.hidden = false;
}
function renderLogin(message = "") {
  app.innerHTML = `<section class="panel" style="max-width:560px;margin:32px auto">
    <p class="eyebrow">Acceso autorizado</p><h1 style="font-size:36px">Resultados del grupo</h1>
    <p class="muted">Inicia sesión para consultar y descargar las evaluaciones.</p>
    ${message ? `<div class="feedback bad">${esc(message)}</div>` : ""}
    <form id="admin-login"><div class="field"><label for="admin-email">Correo electrónico</label><input id="admin-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="admin-password">Contraseña</label><input id="admin-password" name="password" type="password" autocomplete="current-password" required></div>
      <button class="button" type="submit">Entrar al panel →</button></form>
    ${!client ? `<p class="small-note" style="margin-top:18px">Falta configurar la conexión del proyecto en supabase-config.js. Sigue los pasos de SUPABASE_SETUP.md.</p>` : ""}
  </section>`;
}
async function fetchAllResults() {
  const pageSize = 1000;
  const collected = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from("student_results")
      .select("id, student_name, group_name, completed_at, score_part1, score_part2, score_part3, total_correct, total_questions, percent, duration_seconds, missed")
      .order("completed_at", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`No se pudieron leer los resultados: ${error.message}`);
    collected.push(...data);
    if (data.length < pageSize) return collected;
  }
}
function renderRows(query = "") {
  const body = document.getElementById("results-body");
  if (!body) return;
  const normalized = query.trim().toLocaleLowerCase("es");
  const filtered = records.filter(record => `${record.student_name} ${record.group_name || ""}`.toLocaleLowerCase("es").includes(normalized));
  body.innerHTML = filtered.length ? filtered.map(record => `<tr>
    <td><strong>${esc(record.student_name)}</strong></td><td>${esc(record.group_name || "—")}</td>
    <td>${new Date(record.completed_at).toLocaleString("es-CO")}</td>
    <td>${record.score_part1}/5</td><td>${record.score_part2}/5</td><td>${record.score_part3}/5</td>
    <td><strong>${record.total_correct}/${record.total_questions} · ${record.percent}%</strong></td>
    <td>${formatDuration(record.duration_seconds)}</td></tr>`).join("")
    : `<tr><td colspan="8">${normalized ? "No hay resultados que coincidan con la búsqueda." : "Aún no hay evaluaciones registradas."}</td></tr>`;
  const count = document.getElementById("result-count");
  if (count) count.textContent = `${filtered.length} de ${records.length} evaluaciones`;
}
function renderDashboard() {
  const average = records.length ? Math.round(records.reduce((sum, record) => sum + record.percent, 0) / records.length) : 0;
  app.innerHTML = `<section class="page-heading"><div><p class="eyebrow">PANEL PRIVADO</p><h1>Resultados del grupo</h1><p>Consulta las calificaciones y el tiempo empleado. Puedes descargar el listado completo para compartirlo con la profesora.</p></div>
      <div class="button-row"><button class="button secondary" id="refresh-results">Actualizar</button><button class="button" id="download-results" ${records.length ? "" : "disabled"}>Descargar CSV ↓</button><button class="button outline" id="admin-logout">Cerrar sesión</button></div></section>
    <div id="admin-message" class="feedback bad" hidden></div>
    <div class="stat-grid" style="grid-template-columns:repeat(2,1fr)"><div class="stat-card"><span>Evaluaciones recibidas</span><strong>${records.length}</strong><span>desde todos los computadores</span></div><div class="stat-card"><span>Promedio del grupo</span><strong>${records.length ? `${average}%` : "—"}</strong><span>resultado general</span></div></div>
    <section class="panel"><div class="page-heading" style="margin:0 0 16px;align-items:center"><div><h2 style="margin:0">Listado de estudiantes</h2><p id="result-count" class="small-note" style="margin:5px 0 0"></p></div><div class="field" style="min-width:min(100%,280px);margin:0"><label class="visually-hidden" for="results-search">Buscar por estudiante o grupo</label><input id="results-search" type="search" placeholder="Buscar estudiante o grupo"></div></div>
      <div class="table-wrap"><table><thead><tr><th>Estudiante</th><th>Grupo</th><th>Fecha</th><th>Parte 1</th><th>Parte 2</th><th>Parte 3</th><th>Nota total</th><th>Tiempo</th></tr></thead><tbody id="results-body"></tbody></table></div>
    </section>`;
  renderRows();
  document.getElementById("results-search").addEventListener("input", event => renderRows(event.target.value));
  document.getElementById("download-results").addEventListener("click", downloadResults);
  document.getElementById("refresh-results").addEventListener("click", refreshResults);
  document.getElementById("admin-logout").addEventListener("click", signOut);
}
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes ? `${minutes} min ${String(remaining).padStart(2, "0")} s` : `${remaining} s`;
}
function csvCell(value) {
  const safeValue = /^[\s]*[=+\-@]/.test(String(value)) ? `'${value}` : value;
  return `"${String(safeValue ?? "").replace(/"/g, '""')}"`;
}
function downloadResults() {
  if (!records.length) return;
  const headers = ["ID", "Nombre", "Grupo", "Fecha", "Fecha ISO", "Part 1 (%)", "Part 2 (%)", "Part 3 (%)", "Correctas", "Total", "Porcentaje (%)", "Tiempo (seg)", "Dificultades"];
  const rows = records.map(record => [
    record.id, record.student_name, record.group_name || "", new Date(record.completed_at).toLocaleString("es-CO"), record.completed_at,
    record.score_part1 * 20, record.score_part2 * 20, record.score_part3 * 20, record.total_correct, record.total_questions,
    record.percent, record.duration_seconds,
    (record.missed || []).map(item => `${modules[item.module]?.label?.toUpperCase() || item.module} P${item.question}`).join(" | ")
  ]);
  const csv = "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "english-challenge-resultados-grupo.csv";
  link.click();
  URL.revokeObjectURL(url);
}
async function refreshResults() {
  const button = document.getElementById("refresh-results");
  button.disabled = true;
  button.textContent = "Actualizando…";
  try {
    records = await fetchAllResults();
    renderDashboard();
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    const refresh = document.getElementById("refresh-results");
    if (refresh) { refresh.disabled = false; refresh.textContent = "Actualizar"; }
  }
}
async function showDashboard() {
  app.innerHTML = `<section class="panel empty-state"><h2>Cargando resultados…</h2></section>`;
  try {
    records = await fetchAllResults();
    renderDashboard();
  } catch (error) {
    renderLogin(error.message);
  }
}
async function signOut() {
  const { error } = await client.auth.signOut();
  if (error) { showMessage(`No se pudo cerrar sesión: ${error.message}`, true); return; }
  renderLogin();
}
async function init() {
  const config = window.APP_SUPABASE_CONFIG;
  if (config?.url && config?.anonKey && window.supabase?.createClient) {
    client = window.supabase.createClient(config.url, config.anonKey);
    const { data, error } = await client.auth.getSession();
    if (error) { renderLogin(`No se pudo revisar la sesión: ${error.message}`); return; }
    if (data.session) { await showDashboard(); return; }
  }
  renderLogin();
}
app.addEventListener("submit", async event => {
  if (event.target.id !== "admin-login") return;
  event.preventDefault();
  const config = window.APP_SUPABASE_CONFIG;
  if (!client) { renderLogin("La conexión del panel aún no está configurada."); return; }
  const data = new FormData(event.target);
  const { error } = await client.auth.signInWithPassword({
    email: String(data.get("email") || "").trim(),
    password: String(data.get("password") || "")
  });
  if (error) { renderLogin("Usuario o contraseña incorrectos."); return; }
  await showDashboard();
});
init();
