"use strict";
const app=document.querySelector("#app"),modal=document.querySelector("#modal");
let tab="play",region="World",count=10,game=null,result=null,history=[],db=null,storageError="",saved=false,saving=false;
const byCode=code=>countries.find(c=>c.code===code);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const flag=(code,label)=>'<img src="./flags/'+code.toLowerCase()+'.svg" alt="'+esc(label)+'">';
function shuffle(input){const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function picker(label,id,options,value){return '<div class="field"><label for="'+id+'">'+label+'</label><select id="'+id+'">'+options.map(v=>'<option '+(String(v)===String(value)?'selected':'')+' value="'+esc(v)+'">'+esc(v)+(id==='count'?' questions':'')+'</option>').join('')+'</select></div>'}
function notice(){document.querySelector("#storage-notice").innerHTML=storageError?'<div class="notice">'+esc(storageError)+'</div>':""}
async function openDatabase(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open("fun-with-flags",1);
  request.onupgradeneeded=()=>request.result.createObjectStore("results",{keyPath:"id"});
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
  request.onblocked=()=>reject(new Error("Close other tabs to enable saved results."));
 });
}
async function loadHistory(){
 try{db=db||await openDatabase();history=await new Promise((resolve,reject)=>{const tx=db.transaction("results","readonly");const r=tx.objectStore("results").getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});history.sort((a,b)=>b.created-a.created);storageError=""}
 catch{storageError="This browser is blocking saved history. You can still play and download your result report."}
 notice();
}
async function saveResult(){
 if(!result||saving)return;
 saving=true;render();
 try{
  db=db||await openDatabase();
  await new Promise((resolve,reject)=>{const tx=db.transaction("results","readwrite");tx.objectStore("results").put(result);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});
  saved=true;await loadHistory();
 }catch{storageError="Your result could not be saved. Retry saving or download your report before leaving.";notice()}
 finally{saving=false;render()}
}
function start(){
 const pool=countries.filter(c=>region==="World"||c.continent===region);
 const questions=shuffle(pool).slice(0,count);
 game={id:crypto.randomUUID(),region,started:Date.now(),questions,choices:questions.map(c=>shuffle([c,...shuffle(pool.filter(o=>o.code!==c.code)).slice(0,3)])),answers:[],index:0};
 result=null;saved=false;tab="play";render();
}
function answer(code){
 if(!game||game.answers.length>game.index||!game.choices[game.index].some(c=>c.code===code))return;
 game.answers.push({code:game.questions[game.index].code,picked:code});render();
}
function next(){
 if(!game||game.answers.length<=game.index)return;
 if(game.index+1<game.questions.length){game.index++;render();return}
 result={id:game.id,created:Date.now(),region:game.region,correct:game.answers.filter(a=>a.code===a.picked).length,total:game.questions.length,seconds:Math.round((Date.now()-game.started)/1000),answers:game.answers};
 game=null;void saveResult();
}
function report(r){return "Fun with Flags\n"+r.region+" · "+r.correct*10+" points · "+r.correct+"/"+r.total+" correct\n\n"+r.answers.map((a,i)=>(i+1)+". "+byCode(a.code).name+" — your answer: "+byCode(a.picked).name+(a.code===a.picked?" (correct)":" (incorrect)")).join("\n")}
function download(r){const url=URL.createObjectURL(new Blob([report(r)],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="fun-with-flags-report.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function review(r){return '<div class="review">'+r.answers.map((a,i)=>'<div class="reviewrow">'+flag(a.code,byCode(a.code).name+' flag')+'<div><h3>'+(i+1)+'. '+esc(byCode(a.code).name)+'</h3><p class="muted">'+esc(a.code===a.picked?byCode(a.code).capital:'You chose '+byCode(a.picked).name+' · Capital: '+byCode(a.code).capital)+'</p></div><span class="right" aria-label="'+(a.code===a.picked?'Correct':'Incorrect')+'">'+(a.code===a.picked?'✓':'✕')+'</span></div>').join('')+'</div>'}
function showModal(title,content,actions){modal.innerHTML='<h2 id="modal-title">'+title+'</h2>'+content+'<div class="actions">'+actions+'</div>';modal.showModal()}
function render(){
 document.querySelectorAll("[data-tab]").forEach(b=>{b.classList.toggle("active",b.dataset.tab===tab);b.setAttribute("aria-current",b.dataset.tab===tab?"page":"false");b.disabled=!!game&&b.dataset.tab!=="play"});
 if(tab==="learn"){renderLibrary();return}
 if(tab==="history"){renderHistory();return}
 if(game){renderQuestion();return}
 if(result){renderResult();return}
 const correct=history.reduce((s,r)=>s+r.correct,0),total=history.reduce((s,r)=>s+r.total,0);
 app.innerHTML='<div class="intro"><div><p class="eyebrow">Your next expedition</p><h1>How well do you know the world?</h1><p class="muted">Pick your route, then put your flag knowledge to the test.</p></div></div><div class="grid"><section class="playcard"><h2>A world of discovery</h2><div class="previewflag">'+['BD','JP','BR'].map(c=>'<span>'+flag(c,byCode(c).name+' flag')+'</span>').join('')+'</div><div class="controls">'+picker('Choose a region','region',regions,region)+picker('Pick your pace','count',[5,10,20],count)+'</div><button class="primary wide" data-action="start">Start quiz</button><p class="note">10 points per correct answer. No time limit. Smaller regions use each available flag once.</p></section><aside class="passport"><p class="eyebrow">Your explorer passport</p><p class="stamp">One flag.<br>One new discovery.</p><div class="stats"><div><strong>'+history.length+'</strong><span>completed quizzes</span></div><div><strong>'+(total?Math.round(100*correct/total)+'%':'—')+'</strong><span>lifetime accuracy</span></div></div><p class="muted" style="margin-top:18px">48 flags · 6 continents · Endless curiosity</p></aside></div>';
}
function renderQuestion(){
 const q=game.questions[game.index],picked=game.answers[game.index]?.picked;
 app.innerHTML='<section class="quiz"><div class="quiztop"><span class="eyebrow">'+game.region+' / Question '+(game.index+1)+' of '+game.questions.length+'</span><span class="scorepill">'+game.answers.filter(a=>a.code===a.picked).length*10+' points</span></div><progress value="'+game.answers.length+'" max="'+game.questions.length+'" aria-label="Quiz progress"></progress><h1 style="margin-top:28px">Whose flag is this?</h1><div class="flagstage">'+flag(q.code,'Flag to identify')+'</div><div class="answers">'+game.choices[game.index].map((c,i)=>'<button class="answer '+(picked?(c.code===q.code?'correct':c.code===picked?'wrong':''):'')+'" data-answer="'+c.code+'" '+(picked?'disabled':'')+'><span style="color:#61736a;margin-right:14px">'+String.fromCharCode(65+i)+'</span>'+esc(c.name)+(picked&&c.code===q.code?' ✓':picked===c.code?' ✕':'')+'</button>').join('')+'</div>'+(picked?'<div class="feedback" aria-live="polite"><div><h3>'+(picked===q.code?'That’s right! +10 points':'A new flag for your memory.')+'</h3><p class="muted">'+esc(q.name+' · '+q.capital+' · '+q.continent)+'</p></div><button class="primary" data-action="next">'+(game.index+1===game.questions.length?'See results':'Next flag')+'</button></div>':'')+'<button class="secondary" style="margin-top:24px" data-action="leave">Leave quiz</button></section>';
}
function renderResult(){
 app.innerHTML='<section class="quiz"><p class="eyebrow">Your expedition report</p><h1>'+(result.correct/result.total>=.8?'World-class curiosity!':'Another journey complete.')+'</h1><div class="passport" style="min-height:230px;margin-top:24px"><div class="resultscore">'+result.correct*10+' points</div><h2>'+result.correct+' / '+result.total+' correct · '+Math.round(100*result.correct/result.total)+'% accuracy</h2><p class="muted">'+esc(result.region)+' · '+result.seconds+' seconds · '+(saving?'Saving…':saved?'Saved in this browser':'Not saved yet')+'</p></div><div class="actions"><button class="primary" data-action="again" '+(saving?'disabled':'')+'>Play again</button><button class="secondary" data-action="download">Download report</button>'+(!saved?'<button class="secondary" data-action="retry" '+(saving?'disabled':'')+'>Retry save</button>':'')+'</div><h2 style="margin-top:32px">A look back</h2>'+review(result)+'</section>';
}
function renderLibrary(){
 app.innerHTML='<div class="intro"><div><p class="eyebrow">Meet the world</p><h1>The flag library</h1><p class="muted">Explore flags and capitals before your next quiz.</p></div><span id="found" class="scorepill"></span></div><div class="toolbar"><div class="field"><label for="search">Find a country</label><input id="search" class="search" placeholder="Search country or capital…"></div>'+picker('Filter by region','region',regions,region)+'</div><div id="country-list" class="library"></div>';
 updateLibrary();
}
function updateLibrary(){
 const term=document.querySelector("#search").value.toLowerCase();
 const list=countries.filter(c=>(region==="World"||c.continent===region)&&(c.name+' '+c.capital).toLowerCase().includes(term));
 document.querySelector("#found").textContent=list.length+' countries';
 document.querySelector("#country-list").innerHTML=list.length?list.map(c=>'<article class="countrycard">'+flag(c.code,c.name+' flag')+'<h3>'+esc(c.name)+'</h3><p>'+esc(c.capital)+'</p><p>'+c.continent+'</p></article>').join(''):'<p class="muted">No countries found. Try another search or region.</p>';
}
function renderHistory(){
 app.innerHTML='<div class="intro"><div><p class="eyebrow">Your travel journal</p><h1>Every quiz is a new discovery.</h1><p class="muted">Saved on this browser and device. Clearing site data removes these results.</p></div></div>'+(history.length?'<div class="historylist">'+history.map(r=>'<article class="historycard"><div class="historyhead"><div><h2>'+esc(r.region)+' expedition</h2><p class="muted">'+esc(new Date(r.created).toLocaleString())+' · '+r.correct+'/'+r.total+' correct · '+r.seconds+' seconds</p></div><span class="scorepill">'+r.correct*10+' points</span></div><div class="actions"><button class="secondary" data-report="'+esc(r.id)+'">View answers</button><button class="secondary" data-download="'+esc(r.id)+'">Download report</button></div></article>').join('')+'</div>':'<div class="empty"><h2>Your passport is waiting.</h2><p class="muted">Finish a quiz to see your scores and answer reports.</p><button class="primary" data-tab="play">Play a quiz</button></div>');
}
document.addEventListener("click",e=>{
 const b=e.target.closest("button");if(!b||b.disabled)return;
 if(b.dataset.tab){if(game)return;tab=b.dataset.tab;render();return}
 if(b.dataset.answer){answer(b.dataset.answer);return}
 if(b.dataset.report){const r=history.find(r=>r.id===b.dataset.report);if(r)showModal('Quiz answer report',review(r),'<button class="primary" data-action="close">Done</button>');return}
 if(b.dataset.download){const r=history.find(r=>r.id===b.dataset.download);if(r)download(r);return}
 switch(b.dataset.action){
  case "start":start();break;
  case "next":next();break;
  case "download":download(result);break;
  case "retry":void saveResult();break;
  case "again":if(!saved){showModal('Start another quiz?','<p class="muted">This result is not saved. Download it first if you want to keep it.</p>','<button class="secondary" data-action="close">Go back</button><button class="primary" data-action="discard">Start again</button>')}else{result=null;render()}break;
  case "leave":showModal('Leave this quiz?','<p class="muted">Your unfinished answers won’t be saved.</p>','<button class="secondary" data-action="close">Keep playing</button><button class="primary" data-action="discard">Leave quiz</button>');break;
  case "discard":game=null;result=null;modal.close();render();break;
  case "close":modal.close();break;
 }
});
document.addEventListener("change",e=>{if(e.target.id==="region"){region=e.target.value;if(tab==="learn")updateLibrary()}if(e.target.id==="count")count=Number(e.target.value)});
document.addEventListener("input",e=>{if(e.target.id==="search")updateLibrary()});
window.addEventListener("beforeunload",e=>{if(game||(result&&!saved)){e.preventDefault();e.returnValue=""}});
render();void loadHistory().then(render);
