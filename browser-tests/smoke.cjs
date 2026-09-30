const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

// Browser classic scripts must parse without Node's TypeScript stripping.
const data = fs.readFileSync("browser/data.js", "utf8");
const source = fs.readFileSync("browser/app.js", "utf8");
new vm.Script(data);
new vm.Script(source);
const elements = new Map();
const element = selector => {
  if (!elements.has(selector)) elements.set(selector, {
    innerHTML: "", textContent: "", value: "", dataset: {},
    classList: { toggle() {} }, setAttribute() {},
    showModal() {}, close() {}
  });
  return elements.get(selector);
};
const context = vm.createContext({
  document: { querySelector: element, querySelectorAll: () => [], addEventListener() {} },
  window: { addEventListener() {} },
  indexedDB: { open() { throw new Error("Storage unavailable in test"); } },
  crypto: require("node:crypto").webcrypto,
  console, setTimeout, Blob, URL
});
vm.runInContext(data + "\n" + source, context);
assert.match(element("#app").innerHTML, /Start quiz/);
assert.equal(vm.runInContext("countries.length", context), 48);
vm.runInContext("count=5;start()", context);
assert.match(element("#app").innerHTML, /Question 1 of 5/);
for (let i=0; i<5; i++) {
  vm.runInContext("answer(game.questions[game.index].code);answer(game.questions[game.index].code);",context);
  assert.equal(vm.runInContext("game.answers.length",context),i+1);
  vm.runInContext("next()",context);
}
assert.equal(vm.runInContext("result.correct",context),5);
assert.equal(vm.runInContext("result.total",context),5);
assert.match(element("#app").innerHTML,/50 points/);
for (const file of fs.readdirSync("browser/flags")) assert.ok(file.endsWith(".svg"));
console.log("PASS: browser script parsing, startup, five-question quiz, scoring, duplicate-answer prevention.");
