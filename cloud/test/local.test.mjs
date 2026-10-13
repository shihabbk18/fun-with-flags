import fs from "node:fs";
import vm from "node:vm";
import {indexedDB} from "fake-indexeddb";
import {test} from "node:test";
import assert from "node:assert/strict";
const context=vm.createContext({window:{},indexedDB,console});
vm.runInContext(fs.readFileSync(new URL("../../browser/account-store.js",import.meta.url),"utf8"),context);
const store=context.window.FlagStore;
const sample=id=>({id,created:Date.now(),mode:"flag",region:"World",correct:1,total:1,seconds:5,answers:[{code:"BD",picked:"BD",correct:true}]});
test("account queues are isolated and guest import requires an explicit action",async()=>{
 await store.save(sample("guest-game"),"guest");await store.save(sample("alice-game"),"alice");
 assert.equal((await store.list("guest")).length,1);assert.equal((await store.list("alice")).length,1);assert.equal((await store.list("bob")).length,0);
 assert.equal((await store.pending("alice")).length,1);await store.markSynced("alice-game","bob");assert.equal((await store.pending("alice")).length,1);
 await store.markSynced("alice-game","alice");assert.equal((await store.pending("alice")).length,0);
 await store.importGuest("bob");assert.equal((await store.list("guest")).length,0);assert.equal((await store.list("bob")).length,1);
 await store.clearSynced("alice");assert.equal((await store.list("alice")).length,0);assert.equal((await store.list("bob")).length,1);
});
test("cloud records roundtrip into the correct owner without exposing local metadata",()=>{
 const row={...sample("roundtrip"),owner:"alice",cloudSynced:false};
 const wire=store.wire(row);assert.equal(wire.owner,undefined);assert.equal(wire.points,10);
 const value=store.unwire(wire,"alice");assert.equal(value.owner,"alice");assert.equal(value.cloudSynced,true);
 assert.throws(()=>store.unwire({...wire,payload:"{}"},"alice"));
});

test("the same result ID cannot overwrite a different account queue",async()=>{
 await store.save(sample("shared-id"),"alice");await store.save({...sample("shared-id"),correct:0},"bob");
 assert.equal((await store.list("alice")).find(r=>r.id==="shared-id").correct,1);
 assert.equal((await store.list("bob")).find(r=>r.id==="shared-id").correct,0);
});
