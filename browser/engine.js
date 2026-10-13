"use strict";
const modes = {
 flag: {title:"Flag Finder",icon:"⚑",description:"Name the country behind each flag.",question:"Whose flag is this?"},
 capital: {title:"Capital Quest",icon:"◎",description:"Connect countries with their capitals.",question:"Which is its capital?"},
 continent: {title:"Continent Explorer",icon:"◉",description:"Find where each country belongs.",question:"Which continent is it in?"},
 sprint: {title:"60-second Sprint",icon:"◷",description:"Identify as many flags as you can in a minute.",question:"Whose flag is this?"},
 memory: {title:"Flag Match",icon:"▦",description:"Turn over cards and pair flags with country names.",question:"Find every flag’s country."}
};
const byCode=code=>countries.find(c=>c.code===code);
function shuffle(input){const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function poolFor(region,scope,mode){return countries.filter(c=>(region==="World"||c.continent===region)&&(scope!=="countries"||c.standard)&&(mode!=="capital"||c.capitalQuiz))}
function createGame(mode,region,scope,count,now=Date.now()){
 if(!modes[mode]||!regions.includes(region)||!["all","countries"].includes(scope)||![5,10,20,50].includes(count))throw Error("Invalid game settings");
 const pool=poolFor(region,scope,mode);
 if(!pool.length)throw Error("No entries are available for these settings. Choose another region.");
 const base={id:crypto.randomUUID(),mode,region,scope,started:now,index:0,answers:[]};
 if(mode==="memory"){
  const selected=shuffle(pool).slice(0,6);
  return {...base,questions:selected,cards:shuffle(selected.flatMap(c=>[{code:c.code,kind:"flag"},{code:c.code,kind:"name"}])),open:[],matched:[],moves:0};
 }
 const questions=shuffle(pool).slice(0,mode==="sprint"?pool.length:count);
 const choices=questions.map(c=>{
  if(mode==="continent")return shuffle([c.continent,...shuffle(regions.filter(r=>r!=="World"&&r!==c.continent)).slice(0,3)]).map(id=>({id,label:id}));
  const eligible=countries.filter(o=>o.code!==c.code&&(mode!=="capital"||o.capitalQuiz&&o.capital!==c.capital));
  const seen=new Set([mode==="capital"?c.capital:c.name]);
  const others=shuffle(eligible).filter(o=>{const label=mode==="capital"?o.capital:o.name;if(seen.has(label))return false;seen.add(label);return true}).slice(0,3);
  return shuffle([c,...others]).map(o=>({id:o.code,label:mode==="capital"?o.capital:o.name}));
 });
 return {...base,questions,choices,deadline:mode==="sprint"?now+60000:null};
}
function expected(game,index){const c=game.questions[index];return game.mode==="continent"?c.continent:c.code}
function recordAnswer(game,picked,now=Date.now()){
 if(game.mode==="memory"||game.answers.length>game.index||game.deadline&&now>=game.deadline)return false;
 if(!game.choices[game.index].some(o=>o.id===picked))return false;
 game.answers.push({code:game.questions[game.index].code,picked,correct:picked===expected(game,game.index)});
 return true;
}
function revealCard(game,index){
 if(game.mode!=="memory"||!Number.isInteger(index)||index<0||index>=game.cards.length||game.open.length===2||game.open.includes(index)||game.matched.includes(game.cards[index].code))return false;
 game.open.push(index);
 if(game.open.length===2){
  game.moves++;
  const [a,b]=game.open.map(i=>game.cards[i]);
  if(a.code===b.code){game.matched.push(a.code);game.answers.push({code:a.code,picked:a.code,correct:true});game.open=[]}
 }
 return true;
}
function finishGame(game,now=Date.now()){
 const correct=game.answers.filter(a=>a.correct).length;
 return {id:game.id,created:now,mode:game.mode,region:game.region,scope:game.scope,correct,total:game.mode==="sprint"?game.answers.length:game.questions.length,seconds:Math.round((Math.min(now,game.deadline||now)-game.started)/1000),points:correct*10,moves:game.moves||0,answers:game.answers};
}
function resultPoints(r){return r.points??r.correct*10}
function answerCorrect(a){return a.correct??a.code===a.picked}
function answerLabel(r,a){if((r.mode||"flag")==="continent")return a.picked;const c=byCode(a.picked);return c?((r.mode||"flag")==="capital"?c.capital:c.name):"No answer"}
function answerExpected(r,a){const c=byCode(a.code);return r.mode==="capital"?c.capital:r.mode==="continent"?c.continent:c.name}
