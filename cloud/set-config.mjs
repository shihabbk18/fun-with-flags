import fs from "node:fs";
const source=process.argv[2];
if(!source)throw Error("Usage: node cloud/set-config.mjs PUBLIC_CONFIG.json");
const data=JSON.parse(fs.readFileSync(source,"utf8").replace(/^\uFEFF/,""));
const allowed=new Set(["enabled","apiKey","authDomain","projectId","appId","messagingSenderId"]);
function check(c,platform){
 if(!c||Object.keys(c).some(k=>!allowed.has(k)))throw Error("Only public Firebase app settings are accepted. Never supply service-account keys.");
 for(const k of ["apiKey","projectId","appId"])if(typeof c[k]!=="string"||!c[k])throw Error("Missing "+platform+" "+k);
 if(platform==="web"&&!c.authDomain?.endsWith(".firebaseapp.com"))throw Error("Use your Firebase authDomain.");
 if(!c.appId.includes(":"+platform+":"))throw Error("Register a "+platform+" Firebase app and use its matching appId.");
 return {...c,enabled:true};
}
const web=check(data.web,"web"),android=check(data.android,"android");
if(web.projectId!==android.projectId)throw Error("Both platforms must share the same Firebase project.");
for(const [path,c] of [["browser/cloud-config.json",web],["app/src/main/assets/cloud-config.json",android]]){
 fs.writeFileSync(path+".tmp",JSON.stringify(c,null,2)+"\n");fs.renameSync(path+".tmp",path);
}
console.log("Public app settings written. Deploy the rules, enable Email/Password, and verify with two accounts before release.");
