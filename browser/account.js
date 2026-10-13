(function(root){
 const modal=document.querySelector("#modal"),button=document.querySelector("#account-button"),label=document.querySelector("#account-label");
 let adapter=null,user=null,configured=false,busy=false,working=false,syncing=false,generation=0,status="Guest play";
 const emit=()=>{if(label)label.textContent=status;if(button){button.textContent=user?"Account":"Sign in";button.disabled=busy||working}document.dispatchEvent(new CustomEvent("flag-account-change",{detail:{user,owner:user?.uid||"guest",status}}))};
 const message=(text,error=false)=>{const box=modal.querySelector("#account-message");if(box){box.textContent=text;box.className=error?"error":"note"}};
 function errorText(error){
  const c=error?.code||"";
  if(c.includes("too-many-requests"))return "Too many attempts. Wait a little before trying again.";
  if(c.includes("network-request"))return "You appear to be offline. Guest games still work.";
  if(c.includes("weak-password"))return "Use a password with at least 12 characters.";
  if(c.includes("permission-denied"))return "Cloud access was denied. Verify your email and try again.";
  return "This request could not be completed. Check your details and try again.";
 }
 async function sync(){
  if(syncing||!adapter||!user?.verified)return;
  const uid=user.uid,turn=generation;syncing=true;status="Syncing scores…";emit();
  try{
   const records=await FlagStore.pending(uid);
   await adapter.sync(uid,records.map(FlagStore.wire),id=>generation===turn?FlagStore.markSynced(id,uid):Promise.resolve(),rows=>generation===turn?FlagStore.cache(rows,uid):Promise.resolve());
   if(generation===turn){status="Cloud scores up to date";message("Your completed games are synced to your account.");emit()}
  }catch(error){if(generation===turn){status="Saved on this device · sync pending";message(errorText(error),true);emit()}}
  finally{syncing=false}
 }
 function show(){
  if(busy||working)return;
  modal.innerHTML='<h2 id="modal-title">Your account</h2><div id="account-message" role="status"></div>';
  if(!configured){modal.innerHTML+='<p class="muted">Cloud accounts are awaiting activation by the game owner. All five games and local saved results are available now.</p><div class="actions"><button class="primary" data-cloud="close">Continue as guest</button></div>';modal.showModal();return}
  if(user){
   const p=document.createElement("p");p.className="muted";p.textContent=user.email;modal.append(p);
   modal.innerHTML+=(user.verified?'<p class="note">Scores are private to your account. Keep this device secure. You can sign out whenever you need to.</p><div class="actions"><button class="primary" data-cloud="sync">Sync now</button><button class="secondary" data-cloud="import">Import guest games</button></div>':'<p class="note">Check your inbox and verify your email to enable cloud saving.</p><div class="actions"><button class="primary" data-cloud="refresh">I verified my email</button><button class="secondary" data-cloud="verify">Resend verification</button></div>')+
   '<div class="actions"><button class="secondary" data-cloud="logout">Sign out</button><button class="secondary" data-cloud="close">Close</button></div>';
  }else{
   modal.innerHTML+='<p class="muted">Sign in to keep your scores across devices. You can still play as a guest.</p><form id="account-form"><div class="field"><label for="account-email">Email</label><input class="search" id="account-email" type="email" autocomplete="email" maxlength="254" required></div><div class="field"><label for="account-password">Password</label><input class="search" id="account-password" type="password" autocomplete="current-password" maxlength="128" required></div><label class="remember"><input id="account-remember" type="checkbox" checked> Keep me signed in on this device</label><p class="note">Uncheck this on a shared device. New accounts require a password of at least 12 characters and email verification.</p><div class="actions"><button class="primary" type="submit">Sign in</button><button class="secondary" type="button" data-cloud="register">Create account</button></div><div class="actions"><button class="secondary" type="button" data-cloud="reset">Forgot password?</button><button class="secondary" type="button" data-cloud="close">Continue as guest</button></div></form>';
   modal.querySelector("form").addEventListener("submit",e=>{e.preventDefault();void credentials(false)});
  }
  modal.showModal();
 }
 async function credentials(register){
  const form=modal.querySelector("form");if(!form?.reportValidity())return;
  const email=form.querySelector("#account-email").value.trim(),password=form.querySelector("#account-password").value,remember=form.querySelector("#account-remember").checked;
  if(register&&password.length<12){message("New accounts need a password of at least 12 characters.",true);return}
  await perform(async()=>{await (register?adapter.register(email,password,remember):adapter.login(email,password,remember));form.querySelector("#account-password").value="";modal.close();setTimeout(show,0)});
 }
 async function perform(action){
  if(working)return;working=true;emit();modal.querySelectorAll("button").forEach(b=>b.disabled=true);
  try{await action()}catch(error){message(errorText(error),true)}
  finally{working=false;modal.querySelectorAll("button").forEach(b=>b.disabled=false);emit()}
 }
 document.addEventListener("click",e=>{
  const action=e.target.closest("[data-cloud]")?.dataset.cloud;
  if(action==="close"){modal.close();return}
  if(!action||working)return;
  if(action==="register"){void credentials(true);return}
  if(action==="reset"){const input=modal.querySelector("#account-email");if(!input?.reportValidity())return;void perform(async()=>{await adapter.reset(input.value.trim());message("If an account can receive a reset email, instructions will arrive shortly.")});return}
  if(action==="sync"){void sync();return}
  if(action==="verify"){void perform(async()=>{await adapter.verify();message("Verification email requested. Check your inbox.")});return}
  if(action==="refresh"){void perform(async()=>{await adapter.refresh();modal.close();setTimeout(show,0);void sync()});return}
  if(action==="import"){modal.innerHTML='<h2 id="modal-title">Import guest games?</h2><p class="muted">Only continue if the guest games on this device belong to you. They will move to your signed-in account.</p><div id="account-message" role="status"></div><div class="actions"><button class="secondary" data-cloud="close">Cancel</button><button class="primary" data-cloud="confirm-import">Import my guest games</button></div>';return}
  if(action==="confirm-import"){void perform(async()=>{await FlagStore.importGuest(user.uid);message("Guest games imported. Syncing…");void sync()});return}
  if(action==="logout"){void perform(async()=>{const uid=user.uid;await adapter.logout();await FlagStore.clearSynced(uid);modal.close()});return}
 });
 button?.addEventListener("click",show);
 root.FlagAccount={owner:()=>user?.uid||"guest",user:()=>user,sync,show,setBusy(value){busy=value;if(button)button.disabled=busy||working}};
 async function init(){
  try{
   const config=await fetch("./cloud-config.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Config unavailable");return r.json()});
   if(!config.enabled){status="Guest play · saved on this device";emit();return}
   const {connectCloud}=await import("./cloud.bundle.js");
   configured=true;status="Restoring account…";emit();
   adapter=await connectCloud(config,next=>{generation++;user=next;status=next?(next.verified?"Signed in · ready to sync":"Verify your email to enable sync"):"Guest play · saved on this device";emit();if(adapter)void sync()});
   void sync();
  }catch{configured=false;status="Cloud unavailable · guest play works";emit()}
 }
 window.addEventListener("online",()=>void sync());
 void init();
})(window);

