const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const data=fs.readFileSync("browser/data.js","utf8"),engine=fs.readFileSync("browser/engine.js","utf8"),source=fs.readFileSync("browser/app.js","utf8");
for(const script of [data,engine,source])new vm.Script(script);
const elements=new Map();
const element=selector=>{if(!elements.has(selector))elements.set(selector,{innerHTML:"",textContent:"",value:"",dataset:{},classList:{toggle(){}},setAttribute(){},showModal(){},close(){}});return elements.get(selector)};
const context=vm.createContext({document:{querySelector:element,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},indexedDB:{open(){throw Error("Storage disabled for smoke test")}},crypto:require("node:crypto").webcrypto,console,setTimeout,setInterval:()=>1,clearInterval(){},Blob,URL});
const run=s=>vm.runInContext(s,context);
run(data+"\n"+engine+"\n"+source);
assert.match(element("#app").innerHTML,/Start Flag Finder/);
assert.equal(run("countries.length"),250);
assert.equal(run("countries.filter(c=>c.standard).length"),195);
const canonical=JSON.parse(fs.readFileSync("data/countries.json","utf8"));
assert.deepEqual(JSON.parse(run("JSON.stringify(countries)")),canonical);
assert.deepEqual(JSON.parse(fs.readFileSync("app/src/main/assets/countries.json","utf8")),canonical);
assert.equal(new Set(canonical.map(c=>c.code)).size,250);
for(const c of canonical){
 assert.ok(c.capital&&c.name&&c.continent);
 const svg=fs.readFileSync("browser/flags/"+c.code.toLowerCase()+".svg","utf8");
 assert.match(svg,/<svg/);
 assert.doesNotMatch(svg,/<script|<foreignObject/i);
}
for(const mode of ["flag","capital","continent"]){
 run('mode="'+mode+'";count=5;region="World";scope="countries";start()');
 for(let i=0;i<5;i++){
  assert.equal(run("new Set(game.choices[game.index].map(c=>c.label)).size"),4);
  run("answer(expected(game,game.index));answer(expected(game,game.index))");
  assert.equal(run("game.answers.length"),i+1);
  run("next()");
 }
 assert.equal(run("result.correct"),5);assert.equal(run("result.total"),5);
 assert.match(element("#app").innerHTML,/50 points/);
}
run('const sprint=createGame("sprint","World","all",10,1000);');
assert.equal(run("recordAnswer(sprint,expected(sprint,0),60999)"),true);
run("sprint.index++");
assert.equal(run("recordAnswer(sprint,expected(sprint,1),61000)"),false);
assert.equal(run("finishGame(sprint,90000).seconds"),60);
assert.equal(run("finishGame(sprint,90000).total"),1);
assert.equal(run('finishGame(createGame("sprint","World","all",10,0),60000).total'),0);
assert.throws(()=>run('createGame("capital","Antarctica","countries",10)'),/No entries/);
run('const memory=createGame("memory","World","all",10,0);');
assert.equal(run("memory.cards.length"),12);
assert.equal(run("revealCard(memory,0)"),true);
assert.equal(run("revealCard(memory,0)"),false);
run("const wrong=memory.cards.findIndex(c=>c.code!==memory.cards[0].code);revealCard(memory,wrong)");
assert.equal(run("memory.moves"),1);
assert.equal(run("revealCard(memory,11)"),false);
run("memory.open=[];for(const c of memory.questions){const pair=memory.cards.map((card,i)=>({card,i})).filter(x=>x.card.code===c.code);revealCard(memory,pair[0].i);revealCard(memory,pair[1].i)}");
assert.equal(run("memory.matched.length"),6);
assert.equal(run("finishGame(memory,5000).points"),60);
assert.equal(run("finishGame(memory,5000).moves"),7);
run('const oldResult={correct:1,total:1,answers:[{code:"BD",picked:"BD"}],region:"World",seconds:2};');
assert.equal(run("resultPoints(oldResult)"),10);
assert.match(run("report(oldResult)"),/Bangladesh/);
console.log("PASS: 250 entries / 195 countries, bundled flags, all five games, scoring, deadline, memory turns, old history compatibility.");
