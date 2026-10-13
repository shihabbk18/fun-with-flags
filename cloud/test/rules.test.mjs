import fs from "node:fs";
import {initializeTestEnvironment,assertSucceeds,assertFails} from "@firebase/rules-unit-testing";
import {doc,setDoc,getDoc,collection,getDocs} from "firebase/firestore";
import {test,after} from "node:test";
const env=await initializeTestEnvironment({projectId:"demo-fun-with-flags",firestore:{rules:fs.readFileSync(new URL("../firestore.rules",import.meta.url),"utf8")}});
after(()=>env.cleanup());
const id="12345678-1234-1234-1234-123456789abc";
const record={id,created:Date.now(),mode:"flag",region:"World",correct:1,total:1,seconds:10,points:10,moves:0,report:"One correct flag",payload:JSON.stringify({id,answers:[{code:"BD",picked:"BD"}]})};
test("only the verified owner can create and read a result",async()=>{
 const alice=env.authenticatedContext("alice",{email_verified:true}).firestore();
 const bob=env.authenticatedContext("bob",{email_verified:true}).firestore();
 const unverified=env.authenticatedContext("unverified",{email_verified:false}).firestore();
 const guest=env.unauthenticatedContext().firestore();
 await assertSucceeds(setDoc(doc(alice,"users/alice/results/"+id),record));
 await assertSucceeds(getDoc(doc(alice,"users/alice/results/"+id)));
 await assertFails(getDoc(doc(bob,"users/alice/results/"+id)));
 await assertFails(getDocs(collection(bob,"users/alice/results")));
 await assertFails(getDoc(doc(guest,"users/alice/results/"+id)));
 await assertFails(setDoc(doc(unverified,"users/unverified/results/"+id),record));
 await assertFails(setDoc(doc(bob,"users/alice/results/"+id),record));
 await assertSucceeds(setDoc(doc(alice,"users/alice/results/"+id),record));
 await assertFails(setDoc(doc(alice,"users/alice/results/"+id),{...record,points:999}));
});
test("records reject malformed scores, modes, oversized payloads and extra fields",async()=>{
 const alice=env.authenticatedContext("alice",{email_verified:true}).firestore();
 for(const changes of [{points:11},{correct:5,total:1,points:50},{mode:"admin"},{payload:"x".repeat(80001)},{admin:true}]){
  const key=crypto.randomUUID();await assertFails(setDoc(doc(alice,"users/alice/results/"+key),{...record,...changes,id:key}));
 }
});
