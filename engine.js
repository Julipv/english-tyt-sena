"use strict";
(function (root) {
  function normalizeName(name) {
    return String(name || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/\s+/g, " ").trim();
  }

  function flattenEvaluation(ev) {
    const items = [];
    for (const section of ev.sections) {
      for (const q of section.questions) {
        const options = q.options || q.places || section.bank;
        const answer = section.part === 1 ? section.bank.indexOf(q.answer) : q.answer;
        items.push({ part: section.part, section, q, options, answer });
      }
    }
    return items;
  }

  function scoreAttempt(ev, selections) {
    const items = flattenEvaluation(ev);
    const byPart = {};
    const missed = [];
    let correct = 0;
    items.forEach((item, i) => {
      const p = byPart[item.part] || (byPart[item.part] = { correct: 0, total: 0 });
      p.total++;
      const ok = selections[i] === item.answer;
      if (ok) { p.correct++; correct++; }
      else missed.push({ part: item.part, question: p.total });
    });
    const total = items.length;
    return { correct, total, percent: Math.round(100 * correct / total), byPart, missed };
  }

  // Las evaluaciones se califican en el servidor (submit_evaluation); scoreAttempt queda para la práctica.
  const api = { normalizeName, flattenEvaluation, scoreAttempt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TyTEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
