import fs from "node:fs"; import vm from "node:vm";
const src = fs.readFileSync(new URL("../legacy/script.js", import.meta.url), "utf8");
const end = src.indexOf("const lessons = {");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(src.slice(0, end) + "\nthis.out = { evaluation, practice };", ctx);
fs.writeFileSync(new URL("./fixtures/eval1.json", import.meta.url), JSON.stringify(ctx.out, null, 1));
console.log(ctx.out.evaluation.part1.questions.length, ctx.out.evaluation.part2.length, ctx.out.evaluation.part3.length);
