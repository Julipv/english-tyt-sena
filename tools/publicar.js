"use strict";
// Prepara la carpeta publicar/ (lo que se sube a Netlify) SIN las respuestas de las evaluaciones,
// y genera supabase-claves.sql con las respuestas para que el servidor califique.
// Uso: node tools/publicar.js
const fs = require("node:fs");
const path = require("node:path");
const { flattenEvaluation } = require("../engine.js");

// Solo los campos que se muestran en pantalla; todo lo demás (answer, explanation, feedback, clue…) se queda fuera.
const SHOWN = ["prompt", "message", "kind", "a", "q", "gap", "options", "places"];

function publicContent(C) {
  const pub = JSON.parse(JSON.stringify(C));
  for (const ev of Object.values(pub.evaluations)) {
    for (const s of ev.sections) s.questions = s.questions.map(q => Object.fromEntries(SHOWN.filter(k => k in q).map(k => [k, q[k]])));
  }
  return pub;
}

function answerKeys(C) {
  return Object.fromEntries(Object.entries(C.evaluations).map(([id, ev]) => [id, flattenEvaluation(ev).map(it => ({
    part: it.part, answer: it.answer, explanation: it.q.explanation || it.q.feedback || ""
  }))]));
}

function keysSql(keys) {
  const lit = v => `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `-- GENERADO por tools/publicar.js. Contiene las respuestas: NO lo subas a Netlify.\n-- Ejecutar en Supabase → SQL Editor DESPUÉS de supabase-seguridad-2026-11.sql (y cada vez que cambien las evaluaciones).\n` +
    Object.entries(keys).map(([id, items]) => `insert into public.answer_keys (evaluation, items) values ('${id}', ${lit(items)}::jsonb)\n  on conflict (evaluation) do update set items = excluded.items;`).join("\n") + "\n";
}

if (require.main === module) {
  const root = path.join(__dirname, "..");
  const out = path.join(root, "publicar");
  const C = require("../content.js");
  fs.mkdirSync(out, { recursive: true });
  for (const f of ["index.html", "admin.html", "style.css", "app.js", "admin.js", "engine.js", "supabase-config.js", "sena-logo.svg"]) fs.copyFileSync(path.join(root, f), path.join(out, f));
  fs.writeFileSync(path.join(out, "content.js"), `"use strict";\n// Generado por tools/publicar.js: sin respuestas de las evaluaciones.\nwindow.TyTContent = ${JSON.stringify(publicContent(C))};\n`);
  fs.writeFileSync(path.join(root, "supabase-claves.sql"), keysSql(answerKeys(C)));
  console.log("Listo: carpeta publicar/ y supabase-claves.sql");
}

module.exports = { publicContent, answerKeys, keysSql };
