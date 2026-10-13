package com.shihab.funwithflags;
import android.content.Context;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.FirebaseTooManyRequestsException;
import com.google.firebase.auth.*;
import com.google.firebase.firestore.*;
import org.json.*;
import java.io.*;
import java.util.*;
public class CloudAccount {
 public interface Listener {void changed();}
 private static boolean sessionStarted=false;
 private final Context context;private final FlagDatabase db;private final Listener listener;
 private android.net.ConnectivityManager connectivity;
 private android.net.ConnectivityManager.NetworkCallback networkCallback;
 private FirebaseAuth auth;private FirebaseFirestore cloud;private boolean syncing=false;private int generation=0;
 public String status="Guest play · saved on this device";
 public CloudAccount(Context context,FlagDatabase db,Listener listener){
  this.context=context.getApplicationContext();this.db=db;this.listener=listener;
  authListener=a->{
  generation++;FirebaseUser user=a.getCurrentUser();db.setOwner(user==null?"guest":user.getUid());
  status=user==null?"Guest play · saved on this device":user.isEmailVerified()?"Signed in · ready to sync":"Verify your email to enable sync";
  listener.changed();
 };
  try(InputStream in=context.getAssets().open("cloud-config.json");ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
   byte[] buffer=new byte[2048];int n;while((n=in.read(buffer))!=-1)bytes.write(buffer,0,n);
   JSONObject c=new JSONObject(bytes.toString("UTF-8"));
   if(!c.optBoolean("enabled")||c.optString("apiKey").isEmpty()||c.optString("appId").isEmpty())return;
   FirebaseApp app;
   try{app=FirebaseApp.getInstance();}catch(IllegalStateException e){app=FirebaseApp.initializeApp(context,new FirebaseOptions.Builder().setApiKey(c.getString("apiKey")).setApplicationId(c.getString("appId")).setProjectId(c.getString("projectId")).build());}
   auth=FirebaseAuth.getInstance(app);cloud=FirebaseFirestore.getInstance(app);
   if(!sessionStarted){cloud.setFirestoreSettings(new FirebaseFirestoreSettings.Builder().setLocalCacheSettings(MemoryCacheSettings.newBuilder().build()).build());sessionStarted=true;if(!context.getSharedPreferences("account",0).getBoolean("remember",true))auth.signOut();}
   auth.addAuthStateListener(authListener);
   connectivity=(android.net.ConnectivityManager)context.getSystemService(Context.CONNECTIVITY_SERVICE);
   networkCallback=new android.net.ConnectivityManager.NetworkCallback(){@Override public void onAvailable(android.net.Network network){new android.os.Handler(android.os.Looper.getMainLooper()).post(()->sync());}};
   connectivity.registerDefaultNetworkCallback(networkCallback);
  }catch(Exception e){status="Cloud unavailable · guest play works";auth=null;cloud=null;}
 }
 private final FirebaseAuth.AuthStateListener authListener;
 public boolean configured(){return auth!=null;}
 public FirebaseUser user(){return auth==null?null:auth.getCurrentUser();}
 public String owner(){return user()==null?"guest":user().getUid();}
 public void login(String email,String password,boolean remember,java.util.function.Consumer<String> done){
  auth.signInWithEmailAndPassword(email,password).addOnCompleteListener(t->{if(t.isSuccessful()){context.getSharedPreferences("account",0).edit().putBoolean("remember",remember).apply();done.accept(null);sync();}else done.accept(error(t.getException()));});
 }
 public void register(String email,String password,boolean remember,java.util.function.Consumer<String> done){
  auth.createUserWithEmailAndPassword(email,password).addOnCompleteListener(t->{if(t.isSuccessful()){context.getSharedPreferences("account",0).edit().putBoolean("remember",remember).apply();verify(done);}else done.accept(error(t.getException()));});
 }
 public void verify(java.util.function.Consumer<String> done){user().sendEmailVerification().addOnCompleteListener(t->done.accept(t.isSuccessful()?null:error(t.getException())));}
 public void reset(String email,java.util.function.Consumer<String> done){auth.sendPasswordResetEmail(email).addOnCompleteListener(t->done.accept(t.isSuccessful()?null:error(t.getException())));}
 public void refresh(java.util.function.Consumer<String> done){
  FirebaseUser user=user();if(user==null){done.accept("Sign in first.");return;}
  user.reload().addOnCompleteListener(t->{if(!t.isSuccessful()){done.accept(error(t.getException()));return;}user.getIdToken(true).addOnCompleteListener(token->{done.accept(token.isSuccessful()?null:error(token.getException()));listener.changed();sync();});});
 }
 public void logout(){String uid=owner();generation++;auth.signOut();db.clearSynced(uid);}
 public void close(){if(auth!=null)auth.removeAuthStateListener(authListener);if(connectivity!=null&&networkCallback!=null)try{connectivity.unregisterNetworkCallback(networkCallback);}catch(IllegalArgumentException ignored){}generation++;}
 private String error(Exception e){if(e instanceof FirebaseTooManyRequestsException)return "Too many attempts. Try again later.";return "Could not complete this request. Check your details and internet connection.";}
 private boolean same(String uid,int turn){return generation==turn&&user()!=null&&user().getUid().equals(uid)&&user().isEmailVerified();}
 public void sync(){
  FirebaseUser user=user();if(syncing||user==null||!user.isEmailVerified())return;
  final String uid=user.getUid();final int turn=generation;syncing=true;status="Syncing scores…";listener.changed();
  upload(db.pending(uid),0,uid,turn);
 }
 private void upload(List<Map<String,Object>> rows,int index,String uid,int turn){
  if(!same(uid,turn)){syncing=false;return;}
  if(index>=rows.size()){pull(cloud.collection("users").document(uid).collection("results").orderBy("created",Query.Direction.DESCENDING).limit(100),uid,turn);return;}
  Map<String,Object> row=rows.get(index);String id=(String)row.get("id");
  cloud.collection("users").document(uid).collection("results").document(id).set(row).addOnCompleteListener(t->{
   if(!same(uid,turn)){syncing=false;return;}
   if(!t.isSuccessful()){failed();return;}db.markSynced(id,uid);upload(rows,index+1,uid,turn);
  });
 }
 private void pull(Query query,String uid,int turn){
  query.get(Source.SERVER).addOnCompleteListener(t->{
   if(!same(uid,turn)){syncing=false;return;}
   if(!t.isSuccessful()){failed();return;}
   QuerySnapshot page=t.getResult();for(DocumentSnapshot document:page.getDocuments())db.cacheCloud(document.getData(),uid);
   if(page.size()==100){pull(query.startAfter(page.getDocuments().get(99)),uid,turn);return;}
   syncing=false;status="Cloud scores up to date";listener.changed();
  });
 }
 private void failed(){syncing=false;status="Saved on this device · sync pending";listener.changed();}
}
