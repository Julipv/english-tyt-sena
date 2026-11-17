"use strict";
// Tema claro/oscuro elegido por el usuario; si no elige, sigue al sistema.
(function () {
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem("tytTheme"); } catch { /* sin almacenamiento */ }
  if (saved) root.dataset.theme = saved;
  document.addEventListener("click", e => {
    if (!e.target.closest("#theme-toggle")) return;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("tytTheme", root.dataset.theme); } catch { /* sin almacenamiento */ }
  });
})();
