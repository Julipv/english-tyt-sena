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

test("scoreAttempt", () => {
  const ev = C.evaluations.eval1;
  const items = E.flattenEvaluation(ev);
  assert.equal(E.scoreAttempt(ev, items.map(i => i.answer)).percent, 100);
  const none = E.scoreAttempt(ev, items.map(() => -1));
  assert.equal(none.correct, 0); assert.equal(none.missed.length, 15);
});

test("publicar: el sitio no lleva respuestas y las claves coinciden", () => {
  const P = require("../tools/publicar.js");
  const pub = JSON.stringify(P.publicContent(C).evaluations);
  for (const k of ["answer", "explanation", "feedback", "clue", "keywords"]) assert.ok(!pub.includes(`"${k}"`), k);
  const keys = P.answerKeys(C);
  for (const [id, ev] of Object.entries(C.evaluations)) {
    const items = E.flattenEvaluation(ev);
    assert.deepEqual(keys[id].map(k => [k.part, k.answer]), items.map(i => [i.part, i.answer]), id);
    // El sitio público sigue mostrando las mismas preguntas en el mismo orden
    assert.deepEqual(E.flattenEvaluation(P.publicContent(C).evaluations[id]).map(i => i.options), items.map(i => i.options), id);
  }
  assert.ok(P.keysSql(keys).includes("o''clock"), "comillas escapadas en el SQL");
});
