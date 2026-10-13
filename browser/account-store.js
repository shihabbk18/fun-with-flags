(function(root){
 const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 let database=null;
 async function db(){
  if(database)return database;
  const r=indexedDB.open("fun-with-flags",3);
  r.onupgradeneeded=()=>{
   const d=r.result,target=d.createObjectStore("accountResults",{keyPath:["owner","id"]});
   if(d.objectStoreNames.contains("results")){
    const old=r.transaction.objectStore("results").getAll();
    old.onsuccess=()=>{for(const row of old.result)target.put({...row,owner:row.owner||"guest"})};
   }
  };
  database=await request(r);database.onversionchange=()=>{database.close();database=null};return database;
 }
 async function all(){const d=await db();return request(d.transaction("accountResults","readonly").objectStore("accountResults").getAll())}
 async function put(row){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction("accountResults","readwrite");t.objectStore("accountResults").put(row);t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)})}
 async function remove(id,uid){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction("accountResults","readwrite");t.objectStore("accountResults").delete([uid,id]);t.oncomplete=resolve;t.onerror=()=>reject(t.error)})}
 const owner=r=>r.owner||"guest";
 function wire(r){
  const payload={...r};delete payload.owner;delete payload.cloudSynced;
  const mode=r.mode||"flag",correct=r.correct||0,total=r.total||0;
  return {id:r.id,created:r.created,mode,region:r.region,correct,total,seconds:r.seconds||0,points:r.points??correct*10,moves:r.moves||0,report:r.reportText||(typeof root.report==="function"?root.report(r):""),payload:JSON.stringify(payload)};
 }
 function unwire(r,uid){
  if(typeof r.payload!=="string"||r.payload.length>80000)throw Error("Invalid saved result.");
  const payload=JSON.parse(r.payload);
  if(payload.id!==r.id||!Array.isArray(payload.answers))throw Error("Invalid saved result.");
  return {...payload,id:r.id,created:r.created,mode:r.mode,region:r.region,correct:r.correct,total:r.total,seconds:r.seconds,points:r.points,moves:r.moves,reportText:r.report,owner:uid,cloudSynced:true};
 }
 root.FlagStore={
  async list(uid){return (await all()).filter(r=>owner(r)===uid).sort((a,b)=>b.created-a.created)},
  async save(row,uid){await put({...row,owner:uid,cloudSynced:false})},
  async pending(uid){return (await all()).filter(r=>owner(r)===uid&&!r.cloudSynced)},
  async markSynced(id,uid){const rows=await all(),r=rows.find(r=>r.id===id&&owner(r)===uid);if(r)await put({...r,cloudSynced:true})},
  async cache(rows,uid){for(const r of rows)await put(unwire(r,uid))},
  async importGuest(uid){if(uid==="guest")throw Error("Sign in first.");const rows=(await all()).filter(r=>owner(r)==="guest");for(const r of rows){await put({...r,owner:uid,cloudSynced:false});await remove(r.id,"guest")}return rows.length},
  async clearSynced(uid){for(const r of await all())if(owner(r)===uid&&r.cloudSynced)await remove(r.id,uid)},
  wire,unwire,owner
 };
})(window);
