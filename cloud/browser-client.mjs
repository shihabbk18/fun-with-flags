import {initializeApp} from "firebase/app";
import {getAuth,setPersistence,browserLocalPersistence,browserSessionPersistence,onIdTokenChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,signOut} from "firebase/auth";
import {getFirestore,doc,setDoc,collection,query,orderBy,limit,startAfter,getDocs} from "firebase/firestore";
export async function connectCloud(config,changed) {
 if(!config.enabled||!config.apiKey||!config.projectId||!config.appId)throw Error("Cloud accounts are not activated yet.");
 const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app);
 let generation=0;
 const ready=new Promise(resolve=>{
  onIdTokenChanged(auth,user=>{generation++;changed(user?{uid:user.uid,email:user.email,verified:user.emailVerified}:null);resolve()});
 });
 await ready;
 return {
  user:()=>auth.currentUser,
  async login(email,password,remember){await setPersistence(auth,remember?browserLocalPersistence:browserSessionPersistence);await signInWithEmailAndPassword(auth,email,password)},
  async register(email,password,remember){await setPersistence(auth,remember?browserLocalPersistence:browserSessionPersistence);const value=await createUserWithEmailAndPassword(auth,email,password);await sendEmailVerification(value.user)},
  reset:email=>sendPasswordResetEmail(auth,email),
  verify:()=>sendEmailVerification(auth.currentUser),
  async refresh(){if(!auth.currentUser)return;await auth.currentUser.reload();await auth.currentUser.getIdToken(true);changed({uid:auth.currentUser.uid,email:auth.currentUser.email,verified:auth.currentUser.emailVerified})},
  logout:()=>signOut(auth),
  async sync(uid,records,onUploaded,onPage){
   const tokenGeneration=generation;
   const own=()=>generation===tokenGeneration&&auth.currentUser?.uid===uid&&auth.currentUser.emailVerified;
   if(!own())throw Error("Verify your email before cloud sync.");
   for(const row of records){
    if(!own())throw Error("Account changed. Sync stopped.");
    await setDoc(doc(db,"users",uid,"results",row.id),row);
    if(own())await onUploaded(row.id);
   }
   let cursor=null;
   do{
    if(!own())throw Error("Account changed. Sync stopped.");
    const conditions=[orderBy("created","desc"),limit(100)];if(cursor)conditions.push(startAfter(cursor));
    const page=await getDocs(query(collection(db,"users",uid,"results"),...conditions));
    if(!own())throw Error("Account changed. Sync stopped.");
    await onPage(page.docs.map(d=>d.data()));
    if(page.size<100)break;cursor=page.docs.at(-1);
   }while(cursor);
  }
 };
}
