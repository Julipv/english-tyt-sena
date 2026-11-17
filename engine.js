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

  // Evaluación 1 sigue usando la tabla original student_results (no se altera su estructura).
  function legacyPayload(result, ficha) {
    return {
      id: result.id,
      student_name: result.name,
      group_name: ficha,
      completed_at: result.date,
      score_part1: result.byPart[1].correct,
      score_part2: result.byPart[2].correct,
      score_part3: result.byPart[3].correct,
      total_correct: result.correct,
      total_questions: result.total,
      percent: result.percent,
      duration_seconds: result.duration,
      missed: result.missed.map(m => ({ module: `part${m.part}`, question: m.question }))
    };
  }

  function assessmentPayload(result, ficha) {
    return {
      id: result.id,
      evaluation: result.evaluation,
      student_name: result.name,
      student_key: normalizeName(result.name),
      ficha,
      completed_at: result.date,
      scores: result.byPart,
      total_correct: result.correct,
      total_questions: result.total,
      percent: result.percent,
      duration_seconds: result.duration,
      missed: result.missed
    };
  }

  const api = { normalizeName, flattenEvaluation, scoreAttempt, legacyPayload, assessmentPayload };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TyTEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
