"use strict";
const app=document.querySelector("#app"),modal=document.querySelector("#modal");
let tab="play",region="World",scope="all",mode="flag",count=10,game=null,result=null,history=[],db=null,storageError="",saved=false,saving=false,timer=null,lastFeedback="";
const esc=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const flag=(code,label)=>'<img loading="lazy" src="./flags/'+code.toLowerCase()+'.svg" alt="'+esc(label)+'">';
let activeOwner=window.FlagAccount?.owner()||"guest";
const title=r=>modes[r.mode||"flag"]?.title||"Flag Finder";
function picker(label,id,options,value){return '<div class="field"><label for="'+id+'">'+label+'</label><select id="'+id+'">'+options.map(v=>{const key=typeof v==="object"?v.id:v,label=typeof v==="object"?v.label:v;return '<option '+(String(key)===String(value)?'selected':'')+' value="'+esc(key)+'">'+esc(label)+(id==="count"?' questions':'')+'</option>'}).join('')+'</select></div>'}
function notice(){document.querySelector("#storage-notice").innerHTML=storageError?'<div class="notice">'+esc(storageError)+'</div>':""}
async function loadHistory(){
 const owner=window.FlagAccount?.owner()||"guest";
 try{const rows=await FlagStore.list(owner);if(owner!==(window.FlagAccount?.owner()||"guest"))return;history=rows;storageError=""}
 catch{storageError="Saved history is unavailable in this browser. You can still play and download a report."}notice();
}
async function saveResult(){
 if(!result||saving)return;const row={...result,reportText:report(result)},owner=result.owner||activeOwner;
 saving=true;render();
 try{await FlagStore.save(row,owner);if(result?.id===row.id)saved=true;await loadHistory();void window.FlagAccount?.sync()}
 catch{storageError="Could not save your result on this device. Retry or download a report.";notice()}
 finally{saving=false;render()}
}
function start(){try{game=createGame(mode,region,scope,count);game.owner=activeOwner;result=null;saved=false;lastFeedback="";tab="play";if(timer)clearInterval(timer);if(mode==="sprint")timer=setInterval(tick,250);render()}catch(e){showModal("Choose another route",'<p class="muted">'+esc(e.message)+'</p>','<button class="primary" data-action="close">OK</button>')}}
function tick(){if(!game||game.mode!=="sprint")return;if(Date.now()>=game.deadline){finish();return}const clock=document.querySelector("#clock");if(clock)clock.textContent=Math.max(0,Math.ceil((game.deadline-Date.now())/1000))+"s"}
function answer(value){
 if(!game)return;
 if(game.deadline&&Date.now()>=game.deadline){finish();return}
 if(!recordAnswer(game,value))return;
 if(game.mode==="sprint"){const a=game.answers.at(-1);lastFeedback=(a.correct?"✓ Correct: ":"✕ It was ")+byCode(a.code).name;next()}else render();
}
function next(){if(!game||game.answers.length<=game.index)return;if(game.index+1<game.questions.length){game.index++;render()}else finish()}
function finish(){if(!game)return;if(modal.open)modal.close();if(timer)clearInterval(timer);timer=null;result={...finishGame(game),owner:game.owner};game=null;void saveResult()}
function playCard(index){if(!game||!revealCard(game,index))return;if(game.matched.length===game.questions.length)finish();else render()}
function report(r){if(r.reportText&&(!r.answers||!r.answers.length))return r.reportText;return "Fun with Flags — "+title(r)+"\n"+r.region+" · "+resultPoints(r)+" points · "+r.correct+"/"+r.total+" correct"+(r.moves?" · "+r.moves+" turns":"")+"\n\n"+r.answers.map((a,i)=>(i+1)+". "+byCode(a.code).name+" — answer: "+answerLabel(r,a)+"; correct: "+answerExpected(r,a)+(answerCorrect(a)?" ✓":" ✕")).join("\n")}
function download(r){const url=URL.createObjectURL(new Blob([report(r)],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="fun-with-flags-report.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function review(r){if(r.reportText&&(!r.answers||!r.answers.length))return '<pre class="legacy-report">'+esc(r.reportText)+'</pre>';return '<div class="review">'+r.answers.map((a,i)=>'<div class="reviewrow">'+flag(a.code,byCode(a.code).name+' flag')+'<div><h3>'+(i+1)+'. '+esc(byCode(a.code).name)+'</h3><p class="muted">'+esc(answerCorrect(a)?answerExpected(r,a):'You chose '+answerLabel(r,a)+' · Correct: '+answerExpected(r,a))+'</p></div><span class="right" aria-label="'+(answerCorrect(a)?'Correct':'Incorrect')+'">'+(answerCorrect(a)?'✓':'✕')+'</span></div>').join('')+'</div>'}
function showModal(name,content,actions){modal.innerHTML='<h2 id="modal-title">'+name+'</h2>'+content+'<div class="actions">'+actions+'</div>';modal.showModal()}
function resetGame(){if(timer)clearInterval(timer);timer=null;game=null;result=null;modal.close();render()}
function render(){
 window.FlagAccount?.setBusy(!!game||saving);
 document.querySelectorAll("[data-tab]").forEach(b=>{b.classList.toggle("active",b.dataset.tab===tab);b.setAttribute("aria-current",b.dataset.tab===tab?"page":"false");b.disabled=!!game&&b.dataset.tab!=="play"});
 if(tab==="learn"){renderLibrary();return}if(tab==="history"){renderHistory();return}
 if(game){game.mode==="memory"?renderMemory():renderQuestion();return}if(result){renderResult();return}
 const available=poolFor(region,scope,mode).length;
 app.innerHTML='<div class="intro"><div><p class="eyebrow">The whole world is in play</p><h1>Pick your next adventure.</h1><p class="muted">250 countries, territories and other places. Five ways to explore them.</p></div><span class="scorepill">'+history.length+' games completed</span></div>'+
 '<div class="game-modes" role="group" aria-label="Choose a game">'+Object.entries(modes).map(([id,m])=>'<button class="mode-card '+(id===mode?'selected':'')+'" data-mode="'+id+'" aria-pressed="'+(id===mode)+'"><span class="mode-icon" aria-hidden="true">'+m.icon+'</span><h2>'+m.title+'</h2><p>'+m.description+'</p></button>').join('')+'</div>'+
 '<section class="playcard game-setup"><div><p class="eyebrow">Make it your own</p><h2>'+modes[mode].title+'</h2><p class="muted">'+(mode==="sprint"?'One minute. Ten points per correct flag. The clock continues if you switch tabs.':mode==="memory"?'Match up to six flag-and-name pairs. Each pair earns ten points; fewer turns is better.':'Ten points per correct answer. Take your time.')+'</p></div><div class="controls">'+picker('Explore','scope',[{id:"all",label:"All 250 places"},{id:"countries",label:"195 countries only"}],scope)+picker('Region','region',regions,region)+(mode==="sprint"||mode==="memory"?'':picker('Length','count',[5,10,20,50],count))+'</div><button class="primary wide" data-action="start" '+(!available?'disabled':'')+'>Start '+modes[mode].title+'</button><p class="note">'+(available?available+' available entries. Questions do not repeat within a round.':'No eligible entries here. Choose another region or scope.')+'</p></section>'+
 '<p class="note">“195 countries” means the 193 UN members plus Palestine and Vatican City. The extended library includes territories and other listed places. Capitals and continent assignments follow the bundled reference dataset.</p>';
}
function renderQuestion(){
 const q=game.questions[game.index],a=game.answers[game.index],key=expected(game,game.index),isSprint=game.mode==="sprint",score=game.answers.filter(a=>a.correct).length*10;
 app.innerHTML='<section class="quiz"><div class="quiztop"><span class="eyebrow">'+title(game)+' / '+game.region+' / Question '+(game.index+1)+(isSprint?'':' of '+game.questions.length)+'</span><span class="scorepill">'+score+' points'+(isSprint?' · <span id="clock">'+Math.max(0,Math.ceil((game.deadline-Date.now())/1000))+'s</span>':'')+'</span></div><progress value="'+game.answers.length+'" max="'+game.questions.length+'" aria-label="Quiz progress"></progress><h1 style="margin-top:28px">'+modes[game.mode].question+'</h1>'+
 (game.mode==="capital"||game.mode==="continent"?'<h2 class="question-country">'+esc(q.name)+'</h2>':'')+'<div class="flagstage">'+flag(q.code,game.mode==="flag"||isSprint?'Flag to identify':q.name+' flag')+'</div>'+
 (isSprint?'<p class="sprint-feedback" role="status">'+esc(lastFeedback||'Ready, set, explore.')+'</p>':'')+
 '<div class="answers">'+game.choices[game.index].map((o,i)=>'<button class="answer '+(a?(o.id===key?'correct':o.id===a.picked?'wrong':''):'')+'" data-answer="'+esc(o.id)+'" '+(a?'disabled':'')+'><span style="color:#61736a;margin-right:14px">'+String.fromCharCode(65+i)+'</span>'+esc(o.label)+(a&&o.id===key?' ✓':a?.picked===o.id?' ✕':'')+'</button>').join('')+'</div>'+
 (a?'<div class="feedback" aria-live="polite"><div><h3>'+(a.correct?'That’s right! +10 points':'A new fact for your memory.')+'</h3><p class="muted">'+esc(q.name+' · '+q.capital+' · '+q.continent)+'</p></div><button class="primary" data-action="next">'+(game.index+1===game.questions.length?'See results':'Next question')+'</button></div>':'')+'<button class="secondary" style="margin-top:24px" data-action="leave">Leave game</button></section>';
}
function renderMemory(){
 app.innerHTML='<section class="quiz"><div class="quiztop"><span class="eyebrow">Flag Match / '+game.region+'</span><span class="scorepill">'+game.matched.length+'/'+game.questions.length+' pairs · '+game.moves+' turns</span></div><h1>Every flag has a partner.</h1><p class="muted">Turn over two cards. Match each flag to its country name.</p><div class="memory-board">'+game.cards.map((c,i)=>{const matched=game.matched.includes(c.code),open=matched||game.open.includes(i);return '<button class="memory-card '+(matched?'matched':open?'revealed':'')+'" data-card="'+i+'" '+(matched||open||game.open.length===2?'disabled':'')+' aria-label="'+(open?esc(c.kind==='flag'?byCode(c.code).name+' flag':byCode(c.code).name):'Hidden card '+(i+1))+'">'+(open?(c.kind==="flag"?flag(c.code,byCode(c.code).name+' flag'):esc(byCode(c.code).name)):'<span aria-hidden="true">⚑</span>')+'</button>'}).join('')+'</div><div class="feedback" aria-live="polite">'+(game.open.length===2?'<p>Not a match. Remember these two!</p><button class="primary" data-action="hide-cards">Try another pair</button>':'<p>Find all '+game.questions.length+' pairs. Matched pairs stay visible.</p>')+'</div><button class="secondary" style="margin-top:24px" data-action="leave">Leave game</button></section>';
}
function renderResult(){
 const accuracy=result.total?Math.round(100*result.correct/result.total):0;
 app.innerHTML='<section class="quiz"><p class="eyebrow">'+title(result)+' report</p><h1>'+(result.mode==="memory"?'A perfect match.':accuracy>=80?'World-class curiosity!':'Another journey complete.')+'</h1><div class="passport" style="min-height:230px;margin-top:24px"><div class="resultscore">'+resultPoints(result)+' points</div><h2>'+result.correct+' / '+result.total+' '+(result.mode==="memory"?'pairs · '+result.moves+' turns':'correct · '+accuracy+'% accuracy')+'</h2><p class="muted">'+esc(result.region)+' · '+result.seconds+' seconds · '+(saving?'Saving…':saved?'Saved on this device':'Not saved yet')+'</p></div>'+
 (!result.total?'<p class="note">No answers this time. Try again when you’re ready.</p>':'')+
 '<div class="actions"><button class="primary" data-action="again" '+(saving?'disabled':'')+'>Choose another game</button><button class="secondary" data-action="download">Download report</button>'+(!saved?'<button class="secondary" data-action="retry" '+(saving?'disabled':'')+'>Retry save</button>':'')+'</div><h2 style="margin-top:32px">A look back</h2>'+review(result)+'</section>';
}
function renderLibrary(){
 app.innerHTML='<div class="intro"><div><p class="eyebrow">Meet the whole world</p><h1>The flag atlas</h1><p class="muted">Countries, capitals and territories, all in one place.</p></div><span id="found" class="scorepill"></span></div><div class="toolbar atlas-toolbar"><div class="field"><label for="search">Find a country or capital</label><input id="search" class="search" placeholder="Search a name, capital, or country code…"></div>'+picker('Scope','scope',[{id:"all",label:"All 250 places"},{id:"countries",label:"195 countries only"}],scope)+picker('Region','region',regions,region)+'</div><p class="note" style="margin-bottom:20px">Capital / administrative centre shown. Some places have multiple capitals, no permanent capital, or disputed status. Groupings follow the reference dataset.</p><div id="country-list" class="library"></div>';
 updateLibrary();
}
function updateLibrary(){
 const term=document.querySelector("#search").value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const list=poolFor(region,scope,"flag").filter(c=>(c.name+' '+c.capital+' '+c.code+' '+c.aliases).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(term));
 document.querySelector("#found").textContent=list.length+' entries';
 document.querySelector("#country-list").innerHTML=list.length?list.map(c=>'<article class="countrycard">'+flag(c.code,c.name+' flag')+'<h3>'+esc(c.name)+'</h3><p>'+esc(c.capital)+'</p><p>'+c.continent+' · '+(c.standard?'Country':'Territory / other entry')+'</p></article>').join(''):'<p class="muted">No entries found. Try another search or region.</p>';
}
function renderHistory(){
 app.innerHTML='<div class="intro"><div><p class="eyebrow">Your travel journal</p><h1>Every game is a new discovery.</h1><p class="muted">Signed-in games sync to your verified account. Guest games stay on this device.</p></div></div>'+(history.length?'<div class="historylist">'+history.map(r=>'<article class="historycard"><div class="historyhead"><div><h2>'+esc(title(r))+' · '+esc(r.region)+'</h2><p class="muted">'+esc(new Date(r.created).toLocaleString())+' · '+r.correct+'/'+r.total+' '+(r.mode==="memory"?'pairs · '+r.moves+' turns':'correct')+' · '+r.seconds+' seconds</p></div><span class="scorepill">'+resultPoints(r)+' points</span></div><div class="actions"><button class="secondary" data-report="'+esc(r.id)+'">View answers</button><button class="secondary" data-download="'+esc(r.id)+'">Download report</button></div></article>').join('')+'</div>':'<div class="empty"><h2>Your passport is waiting.</h2><p class="muted">Finish a game to see your scores and answer reports.</p><button class="primary" data-tab="play">Choose a game</button></div>');
}
document.addEventListener("click",e=>{
 const b=e.target.closest("button");if(!b||b.disabled)return;
 if(b.dataset.tab){if(game)return;tab=b.dataset.tab;render();return}
 if(b.dataset.mode){mode=b.dataset.mode;render();return}
 if(b.dataset.answer){answer(b.dataset.answer);return}
 if(b.dataset.card!==undefined){playCard(Number(b.dataset.card));return}
 if(b.dataset.report){const r=history.find(r=>r.id===b.dataset.report);if(r)showModal(esc(title(r)),review(r),'<button class="primary" data-action="close">Done</button>');return}
 if(b.dataset.download){const r=history.find(r=>r.id===b.dataset.download);if(r)download(r);return}
 switch(b.dataset.action){
 case "start":start();break;case "next":next();break;case "download":download(result);break;case "retry":void saveResult();break;
 case "hide-cards":if(game?.mode==="memory"){game.open=[];render()}break;
 case "again":if(!saved)showModal('Leave this result?','<p class="muted">It is not saved. Download the report first if you want to keep it.</p>','<button class="secondary" data-action="close">Go back</button><button class="primary" data-action="discard">Choose another game</button>');else{result=null;render()}break;
 case "leave":showModal('Leave this game?','<p class="muted">Unfinished progress won’t be saved. The sprint clock keeps running.</p>','<button class="secondary" data-action="close">Keep playing</button><button class="primary" data-action="discard">Leave game</button>');break;
 case "discard":resetGame();break;case "close":modal.close();break;
 }
});
document.addEventListener("change",e=>{if(["region","scope","count"].includes(e.target.id)){if(e.target.id==="region")region=e.target.value;if(e.target.id==="scope")scope=e.target.value;if(e.target.id==="count")count=Number(e.target.value);if(tab==="learn")updateLibrary();else render()}});
document.addEventListener("input",e=>{if(e.target.id==="search")updateLibrary()});
document.addEventListener("visibilitychange",tick);
window.addEventListener("beforeunload",e=>{if(game||(result&&!saved)){e.preventDefault();e.returnValue=""}});
document.addEventListener("flag-account-change",event=>{
 const owner=event.detail.owner;
 if(owner!==activeOwner){if(timer)clearInterval(timer);timer=null;game=null;result=null;saved=false;activeOwner=owner;history=[];if(modal.open)modal.close()}
 void loadHistory().then(render);
});
render();void loadHistory().then(render);
