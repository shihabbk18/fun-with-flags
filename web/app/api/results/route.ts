import { database } from "@/db/storage";
import { countries, regions } from "@/lib/countries";
export async function GET(request:Request) {
 const owner=request.headers.get("oai-authenticated-user-id");
 if(!owner) return Response.json({error:"Please sign in to load your results."},{status:401});
 try {
  const data=await database().prepare("SELECT id,created,region,correct,total,seconds,answers FROM results WHERE owner=? ORDER BY created DESC LIMIT 100").bind(owner).all();
  return Response.json({results:data.results.map((r:any)=>({...r,answers:JSON.parse(r.answers)}))});
 } catch(e) { console.error(e); return Response.json({error:"Your history is temporarily unavailable. Please try again."},{status:503}); }
}
export async function POST(request:Request) {
 const owner=request.headers.get("oai-authenticated-user-id");
 if(!owner) return Response.json({error:"Please sign in to save your results."},{status:401});
 if(request.headers.get("origin") && request.headers.get("origin")!==new URL(request.url).origin) return Response.json({error:"Invalid origin"},{status:403});
 try {
  const data=await request.json() as any;
  if(typeof data.id!=="string" || !/^[a-f0-9-]{36}$/.test(data.id) || !regions.includes(data.region) ||
   !Array.isArray(data.answers) || data.answers.length<1 || data.answers.length>20 ||
   !Number.isInteger(data.seconds) || data.seconds<0 || data.seconds>604800) return Response.json({error:"Invalid quiz result."},{status:400});
  const seen=new Set();
  for(const answer of data.answers) {
   const country=countries.find(c=>c.code===answer.code);
   if(!country || seen.has(answer.code) || !countries.some(c=>c.code===answer.picked) || (data.region!=="World" && country.continent!==data.region)) return Response.json({error:"Invalid answers."},{status:400});
   seen.add(answer.code);
  }
  const correct=data.answers.filter((a:any)=>a.code===a.picked).length;
  const created=Date.now();
  await database().prepare("INSERT INTO results(id,owner,created,region,correct,total,seconds,answers) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING")
   .bind(data.id,owner,created,data.region,correct,data.answers.length,data.seconds,JSON.stringify(data.answers.map((a:any)=>({code:a.code,picked:a.picked})))).run();
  return Response.json({saved:true});
 } catch(e) { console.error(e); return Response.json({error:"Could not save this result. Keep this page open and retry."},{status:503}); }
}
