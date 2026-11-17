const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../engine.js");
const C = require("../content.js");
const fx = require("./fixtures/eval1.json");

test("normalizeName", () => {
  assert.equal(E.normalizeName("  José  PÉREZ "), "jose perez");
});

test("eval1 idéntica a la original", () => {
  const items = E.flattenEvaluation(C.evaluations.eval1);
  const ev = fx.evaluation;
  const orig = [
    ...ev.part1.questions.map(q => ({ text: q.prompt, options: ev.part1.bank, answer: ev.part1.bank.indexOf(q.answer) })),
    ...ev.part2.map(q => ({ text: q.message, options: q.places, answer: q.answer })),
    ...ev.part3.map(q => ({ text: q.a, options: q.options, answer: q.answer }))
  ];
  assert.deepEqual(items.map(i => ({ text: i.q.prompt || i.q.message || i.q.a, options: i.options, answer: i.answer })), orig);
  assert.deepEqual(C.practice, fx.practice);
});

test("conteos y opciones válidas", () => {
  const counts = { eval1: 15, eval2: 12, eval3: 12, final: 28 };
  const optLen = { 1: 8, 2: [3, 4], 3: 3, 4: 3, 5: 3, 6: 4, 7: 4 };
  for (const [id, n] of Object.entries(counts)) {
    const items = E.flattenEvaluation(C.evaluations[id]);
    assert.equal(items.length, n, id);
    for (const it of items) {
      const want = [].concat(optLen[it.part]);
      assert.ok(want.includes(it.options.length), `${id} parte ${it.part} opciones`);
      assert.ok(it.answer >= 0 && it.answer < it.options.length, `${id} parte ${it.part} respuesta`);
      if (it.q.gap) assert.ok(it.section.passage.includes(`(${it.q.gap}) ___`), `${id} hueco ${it.q.gap}`);
    }
  }
  const perPart = {};
  E.flattenEvaluation(C.evaluations.final).forEach(i => perPart[i.part] = (perPart[i.part] || 0) + 1);
  assert.deepEqual(Object.values(perPart), [4, 4, 4, 4, 4, 4, 4]);
  for (const p of Object.values(C.parts)) for (const ex of p.examples) assert.equal(E.flattenEvaluation({ sections: [ex] })[0].answer >= 0, true);
});

test("scoreAttempt y payloads", () => {
  const ev = C.evaluations.eval1;
  const items = E.flattenEvaluation(ev);
  const all = E.scoreAttempt(ev, items.map(i => i.answer));
  assert.equal(all.percent, 100);
  const none = E.scoreAttempt(ev, items.map(() => -1));
  assert.equal(none.correct, 0); assert.equal(none.missed.length, 15);
  const r = { ...E.scoreAttempt(ev, items.map((i, k) => k % 2 ? i.answer : -1)), id: "x", name: "Ana", date: new Date().toISOString(), duration: 30, evaluation: "eval1" };
  const p = E.legacyPayload(r, "3230441");
  assert.equal(p.total_questions, 15);
  assert.equal(p.total_correct, p.score_part1 + p.score_part2 + p.score_part3);
  assert.equal(p.percent, Math.round(100 * p.total_correct / 15));
  const a = E.assessmentPayload({ ...r, name: " Ána  Ruiz" }, "3230441");
  assert.equal(a.student_key, "ana ruiz");
});
