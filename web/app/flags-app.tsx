"use client";
import {useState,useEffect,useRef} from "react";
import {Tabs,TabsList,TabsTrigger} from "@/components/ui/tabs";
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from "@/components/ui/select";
import {Progress} from "@/components/ui/progress";
import {AlertDialog,AlertDialogTrigger,AlertDialogContent,AlertDialogTitle,AlertDialogDescription,AlertDialogHeader,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from "@/components/ui/alert-dialog";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from "@/components/ui/dialog";
import {countries,regions,Country} from "@/lib/countries";
type Answer={code:string;picked:string};
type Result={id:string;created:number;region:string;correct:number;total:number;seconds:number;answers:Answer[]};
type Game={id:string;region:string;started:number;questions:Country[];choices:Country[][];answers:Answer[]};
function shuffled<T>(input:T[]){const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const country=(code:string)=>countries.find(c=>c.code===code)!;
function flag(code:string,alt:string,className?:string){return <img className={className} src={"/flags/"+code.toLowerCase()+".svg"} alt={alt}/>}
function RegionSelect({value,onChange,label="Choose a region"}:{value:string;onChange:(v:string)=>void;label?:string}){return <div className="field"><label>{label}</label><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{regions.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>}
function report(r:Result){return "Fun with Flags\n"+r.region+" · "+r.correct*10+" points · "+r.correct+"/"+r.total+" correct\n\n"+r.answers.map((a,i)=>(i+1)+". "+country(a.code).name+" — your answer: "+country(a.picked).name+(a.code===a.picked?" (correct)":" (incorrect)")).join("\n")}
function download(r:Result){const url=URL.createObjectURL(new Blob([report(r)],{type:"text/plain;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download="flag-report-"+new Date(r.created).toISOString().slice(0,10)+".txt";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function Review({result}:{result:Result}){return <div className="review">{result.answers.map((a,i)=><div className="reviewrow" key={a.code}>{flag(a.code,country(a.code).name+" flag")}<div><h3>{i+1}. {country(a.code).name}</h3><p className="muted">{a.code===a.picked?country(a.code).capital:"You chose "+country(a.picked).name+" · Capital: "+country(a.code).capital}</p></div><span className="right" aria-label={a.code===a.picked?"Correct":"Incorrect"}>{a.code===a.picked?"✓":"✕"}</span></div>)}</div>}
export default function Page(){
 const [tab,setTab]=useState("play"),[region,setRegion]=useState("World"),[count,setCount]=useState("10"),[search,setSearch]=useState("");
 const [game,setGame]=useState<Game|null>(null),[index,setIndex]=useState(0),[result,setResult]=useState<Result|null>(null);
 const [history,setHistory]=useState<Result[]>([]),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState("");
 const [saving,setSaving]=useState(false),[saved,setSaved]=useState(false),[saveError,setSaveError]=useState(""),[viewReport,setViewReport]=useState<Result|null>(null);
 const answerLock=useRef(false),finishLock=useRef(false),saveLock=useRef(false);
 async function loadHistory(){setLoading(true);setLoadError("");try{const response=await fetch("/api/results");const data=await response.json() as {error?:string;results:Result[]};if(!response.ok)throw new Error(data.error);setHistory(data.results)}catch(e){setLoadError(e instanceof Error?e.message:"History is unavailable.")}finally{setLoading(false)}}
 useEffect(()=>{void loadHistory()},[]);
 function startQuiz(r=region,n=Number(count)){
  if(!regions.includes(r)||![5,10,20].includes(n))throw new Error("Choose a valid region and question count.");
  const pool=countries.filter(c=>r==="World"||c.continent===r),questions=shuffled(pool).slice(0,n);
  setGame({id:crypto.randomUUID(),region:r,started:Date.now(),questions,choices:questions.map(c=>shuffled([c,...shuffled(pool.filter(o=>o.code!==c.code)).slice(0,3)])),answers:[]});
  answerLock.current=false;finishLock.current=false;setIndex(0);setResult(null);setSaved(false);setSaveError("");setTab("play");
 }
 function answer(code:string){
  if(!game||answerLock.current||game.answers.length>index||!game.choices[index].some(c=>c.code===code))return;
  answerLock.current=true;setGame({...game,answers:[...game.answers,{code:game.questions[index].code,picked:code}]});
 }
 async function saveResult(value:Result){
  if(saveLock.current)return;saveLock.current=true;setSaving(true);setSaveError("");
  try{const response=await fetch("/api/results",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});const data=await response.json() as {error?:string;results:Result[]};if(!response.ok)throw new Error(data.error);setSaved(true);void loadHistory()}
  catch(e){setSaveError(e instanceof Error?e.message:"Could not save. Please retry.")}
  finally{saveLock.current=false;setSaving(false)}
 }
 function next(){
  if(!game||game.answers.length<=index||finishLock.current)return;
  if(index+1<game.questions.length){setIndex(index+1);answerLock.current=false;return}
  finishLock.current=true;const completed:Result={id:game.id,created:Date.now(),region:game.region,correct:game.answers.filter(a=>a.code===a.picked).length,total:game.questions.length,seconds:Math.min(604800,Math.round((Date.now()-game.started)/1000)),answers:game.answers};
  setResult(completed);setGame(null);void saveResult(completed);
 }
 useEffect(()=>{if(!game&&!saveError)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=""};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn)},[game,saveError]);
 const state=useRef({game,result,tab});state.current={game,result,tab};
 useEffect(()=>{
  const context=(document as any).modelContext;if(!context?.registerTool)return;
  const abort=new AbortController();
  for(const tool of [
   {name:"read_flag_quiz",description:"Read the current flag quiz progress and displayed result.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({view:state.current.tab,answered:state.current.game?.answers.length??0,total:state.current.game?.questions.length??0,result:state.current.result})},
   {name:"start_flag_quiz",description:"Start a new flag quiz in the visible play screen. Fails if a quiz is already active.",inputSchema:{type:"object",properties:{region:{type:"string",enum:regions},count:{type:"integer",enum:[5,10,20]}},required:["region","count"],additionalProperties:false},annotations:{readOnlyHint:false},execute:async(input:any)=>{if(state.current.game)throw new Error("Finish or leave the current quiz first.");if(!input||!regions.includes(input.region)||![5,10,20].includes(input.count))throw new Error("Invalid quiz settings.");startQuiz(input.region,input.count);await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));return{started:true,region:input.region,count:Math.min(input.count,countries.filter(c=>input.region==="World"||c.continent===input.region).length)}}}
  ]){try{Promise.resolve(context.registerTool(tool,{signal:abort.signal})).catch(()=>{})}catch{}}
  return()=>abort.abort();
 },[]);
 const totalCorrect=history.reduce((s,r)=>s+r.correct,0),totalAnswered=history.reduce((s,r)=>s+r.total,0);
 const filtered=countries.filter(c=>(region==="World"||c.continent===region)&&(c.name+" "+c.capital).toLowerCase().includes(search.toLowerCase()));
 const active=game?.questions[index],picked=game?.answers[index]?.picked;
 return <div className="shell">
 <header className="header"><div className="brand"><img src="/favicon.svg" className="mark" alt=""/>Fun with Flags</div><span className="topmeta">A little curiosity. A whole world.</span></header>
 <Tabs value={tab} onValueChange={setTab}><TabsList className="nav" aria-label="Main navigation"><TabsTrigger value="play">Play a quiz</TabsTrigger><TabsTrigger value="learn" disabled={!!game}>Flag library</TabsTrigger><TabsTrigger value="history" disabled={!!game}>My results</TabsTrigger></TabsList></Tabs>
 <main>
 {tab==="play"&&!game&&!result&&<>
  <div className="intro"><div><p className="eyebrow">Your next expedition</p><h1>How well do you know the world?</h1><p className="muted">Pick your route, then put your flag knowledge to the test.</p></div></div>
  <div className="grid"><section className="playcard"><h2>A world of discovery</h2><div className="previewflag">{["BD","JP","BR"].map(c=><span key={c}>{flag(c,country(c).name+" flag")}</span>)}</div>
  <div className="controls"><RegionSelect value={region} onChange={setRegion}/><div className="field"><label>Pick your pace</label><Select value={count} onValueChange={setCount}><SelectTrigger aria-label="Number of questions"><SelectValue/></SelectTrigger><SelectContent>{[5,10,20].map(n=><SelectItem key={n} value={String(n)}>{n} questions</SelectItem>)}</SelectContent></Select></div></div>
  <button className="primary wide" onClick={()=>startQuiz()}>Start quiz</button><p className="note">10 points per correct answer. No time limit. {region!=="World"?"This region has "+countries.filter(c=>c.continent===region).length+" flags; each appears once at most.":"Every quiz is a fresh mix of flags."}</p></section>
  <aside className="passport"><p className="eyebrow">Your explorer passport</p><p className="stamp">One flag.<br/>One new discovery.</p><div className="stats"><div><strong>{loading?"—":history.length}</strong><span>completed quizzes</span></div><div><strong>{loading?"—":totalAnswered?Math.round(100*totalCorrect/totalAnswered)+"%":"—"}</strong><span>accuracy · last 100 quizzes</span></div></div><p className="muted" style={{marginTop:18}}>48 flags · 6 continents · Endless curiosity</p></aside></div>
  {loadError&&<div className="error" role="alert">{loadError} <button onClick={loadHistory}>Retry history</button></div>}
 </>}
 {tab==="play"&&game&&active&&<section className="quiz">
 <div className="quiztop"><span className="eyebrow">{game.region} / Question {index+1} of {game.questions.length}</span><span className="scorepill">{game.answers.filter(a=>a.code===a.picked).length*10} points</span></div>
 <Progress className="progress" value={100*game.answers.length/game.questions.length} aria-label="Quiz progress"/>
 <h1 style={{marginTop:28}}>Whose flag is this?</h1><div className="flagstage">{flag(active.code,"Flag to identify")}</div>
 <div className="answers">{game.choices[index].map((c,i)=><button key={c.code} className={"answer "+(picked?(c.code===active.code?"correct":c.code===picked?"wrong":""):"")} disabled={!!picked} onClick={()=>answer(c.code)}><span style={{color:"#61736a",marginRight:14}}>{String.fromCharCode(65+i)}</span>{c.name}{picked&&c.code===active.code?" ✓":picked===c.code?" ✕":""}</button>)}</div>
 {picked&&<div className="feedback" aria-live="polite"><div><h3>{picked===active.code?"That’s right! +10 points":"A new flag for your memory."}</h3><p className="muted">{active.name} · {active.capital} · {active.continent}</p></div><button className="primary" onClick={next}>{index===game.questions.length-1?"See results":"Next flag"}</button></div>}
 <AlertDialog><AlertDialogTrigger asChild><button className="secondary" style={{marginTop:24}}>Leave quiz</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Leave this quiz?</AlertDialogTitle><AlertDialogDescription>Your unfinished answers won’t be saved.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep playing</AlertDialogCancel><AlertDialogAction onClick={()=>setGame(null)}>Leave quiz</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </section>}
 {tab==="play"&&result&&<section className="quiz"><p className="eyebrow">Your expedition report</p><h1>{result.correct/result.total>=.8?"World-class curiosity!":"Another journey complete."}</h1><div className="passport" style={{minHeight:230,marginTop:24}}><div className="resultscore">{result.correct*10} points</div><h2>{result.correct} / {result.total} correct · {Math.round(100*result.correct/result.total)}% accuracy</h2><p className="muted">{result.region} · {result.seconds} seconds · {saving?"Saving your result…":saved?"Saved to your results":"Result not yet saved"}</p></div>
 {saveError&&<div className="error" role="alert">{saveError} <button onClick={()=>saveResult(result)} disabled={saving}>Retry save</button></div>}
 <div className="actions"><button className="primary" disabled={saving||!!saveError} onClick={()=>setResult(null)}>Play again</button><button className="secondary" onClick={()=>download(result)}>Download report</button></div><h2 style={{marginTop:32}}>A look back</h2><Review result={result}/></section>}
 {tab==="learn"&&<><div className="intro"><div><p className="eyebrow">Meet the world</p><h1>The flag library</h1><p className="muted">Explore flags and capitals before your next quiz.</p></div><span className="scorepill">{filtered.length} countries</span></div><div className="toolbar"><div className="field"><label htmlFor="search">Find a country</label><input id="search" className="search" placeholder="Search country or capital…" value={search} onChange={e=>setSearch(e.target.value)}/></div><RegionSelect value={region} onChange={setRegion} label="Filter by region"/></div><div className="library">{filtered.map(c=><article className="countrycard" key={c.code}>{flag(c.code,c.name+" flag")}<h3>{c.name}</h3><p>{c.capital}</p><p>{c.continent}</p></article>)}</div>{!filtered.length&&<div className="empty"><h2>No countries found</h2><p className="muted">Try another country, capital, or region.</p></div>}</>}
 {tab==="history"&&<><div className="intro"><div><p className="eyebrow">Your travel journal</p><h1>Every quiz is a new discovery.</h1><p className="muted">Your latest 100 quizzes, saved to your account.</p></div></div>{loading?<p className="muted" role="status">Loading your results…</p>:loadError?<div className="error" role="alert">{loadError} <button onClick={loadHistory}>Try again</button></div>:!history.length?<div className="empty"><h2>Your passport is waiting.</h2><p className="muted">Finish your first quiz to see your scores and answer reports.</p><button className="primary" onClick={()=>setTab("play")}>Play a quiz</button></div>:<div className="historylist">{history.map(r=><article className="historycard" key={r.id}><div className="historyhead"><div><h2>{r.region} expedition</h2><p className="muted">{new Date(r.created).toLocaleString()} · {r.correct}/{r.total} correct · {r.seconds} seconds</p></div><span className="scorepill">{r.correct*10} points</span></div><div className="actions"><button className="secondary" onClick={()=>setViewReport(r)}>View answers</button><button className="secondary" onClick={()=>download(r)}>Download report</button></div></article>)}</div>}</>}
 </main><footer><span>Learn at your own pace. Every answer is a discovery.</span><a href="https://flagpedia.net" target="_blank" rel="noreferrer">Flags by Flagpedia</a></footer>
 <Dialog open={!!viewReport} onOpenChange={open=>!open&&setViewReport(null)}><DialogContent style={{maxHeight:"85vh",overflowY:"auto",maxWidth:700}}><DialogHeader><DialogTitle>Quiz answer report</DialogTitle><DialogDescription>{viewReport?.region} · {viewReport?.correct} / {viewReport?.total} correct</DialogDescription></DialogHeader>{viewReport&&<Review result={viewReport}/>}</DialogContent></Dialog>
 </div>
}

