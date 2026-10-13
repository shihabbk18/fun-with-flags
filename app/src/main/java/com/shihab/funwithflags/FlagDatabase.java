package com.shihab.funwithflags;
import android.content.*;
import android.database.Cursor;
import android.database.sqlite.*;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
public class FlagDatabase extends SQLiteOpenHelper {
 private final Context context;
 private String owner="guest";
 public void setOwner(String uid){owner=uid==null?"guest":uid;}
 public String owner(){return owner;}
 public FlagDatabase(Context context){super(context,"flags.db",null,3);this.context=context.getApplicationContext();}
 @Override public void onCreate(SQLiteDatabase db){
  db.execSQL("CREATE TABLE countries(code TEXT PRIMARY KEY,name TEXT NOT NULL,capital TEXT NOT NULL,continent TEXT NOT NULL,standard INTEGER NOT NULL DEFAULT 1,capital_quiz INTEGER NOT NULL DEFAULT 1)");
  createResults(db);
  seed(db);
 }
 private void createResults(SQLiteDatabase db){
  db.execSQL("CREATE TABLE results(id TEXT NOT NULL,owner TEXT NOT NULL DEFAULT 'guest',completed INTEGER NOT NULL,region TEXT NOT NULL,correct INTEGER NOT NULL,total INTEGER NOT NULL,seconds INTEGER NOT NULL,report TEXT NOT NULL,mode TEXT NOT NULL DEFAULT 'flag',actual_region TEXT NOT NULL DEFAULT 'World',payload TEXT NOT NULL DEFAULT '',synced INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(owner,id))");
 }
 private void seed(SQLiteDatabase db){
  try(InputStream in=context.getAssets().open("countries.json");ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
   byte[] buffer=new byte[4096];int n;while((n=in.read(buffer))!=-1)bytes.write(buffer,0,n);
   JSONArray data=new JSONArray(bytes.toString(StandardCharsets.UTF_8.name()));
   for(int i=0;i<data.length();i++){
    JSONObject c=data.getJSONObject(i);ContentValues v=new ContentValues();
    for(String key:new String[]{"code","name","capital","continent"})v.put(key,c.getString(key));
    v.put("standard",c.getBoolean("standard")?1:0);v.put("capital_quiz",c.getBoolean("capitalQuiz")?1:0);
    db.insertWithOnConflict("countries",null,v,SQLiteDatabase.CONFLICT_REPLACE);
   }
  }catch(IOException|JSONException e){throw new IllegalStateException("Could not load bundled country catalog",e);}
 }
 @Override public void onUpgrade(SQLiteDatabase db,int oldVersion,int newVersion){
  if(oldVersion<2){db.execSQL("ALTER TABLE countries ADD COLUMN standard INTEGER NOT NULL DEFAULT 1");db.execSQL("ALTER TABLE countries ADD COLUMN capital_quiz INTEGER NOT NULL DEFAULT 1");seed(db);}
  if(oldVersion<3){
   db.execSQL("ALTER TABLE results RENAME TO results_v2");
   createResults(db);
   db.execSQL("INSERT INTO results(id,completed,region,correct,total,seconds,report,mode,actual_region) SELECT id,completed,region,correct,total,seconds,report,CASE WHEN region LIKE 'Capital Quest%' THEN 'capital' WHEN region LIKE 'Continent Explorer%' THEN 'continent' WHEN region LIKE '60-second Sprint%' THEN 'sprint' WHEN region LIKE 'Flag Match%' THEN 'memory' ELSE 'flag' END,CASE WHEN instr(region,' · ')>0 THEN substr(region,instr(region,' · ')+3) ELSE region END FROM results_v2");
   db.execSQL("DROP TABLE results_v2");
  }
 }
 public List<Country> countries(String region,String search){return countries(region,search,false);}
 public List<Country> countries(String region,String search,boolean onlyCountries){
  List<Country> out=new ArrayList<>();
  try(Cursor c=getReadableDatabase().rawQuery("SELECT code,name,capital,continent,standard,capital_quiz FROM countries WHERE (?='World' OR continent=?) AND (?='0' OR standard=1) AND (name LIKE ? ESCAPE '\\' OR capital LIKE ? ESCAPE '\\' OR code LIKE ? ESCAPE '\\') ORDER BY name",new String[]{region,region,onlyCountries?"1":"0","%"+escape(search)+"%","%"+escape(search)+"%","%"+escape(search)+"%"})){
   while(c.moveToNext())out.add(new Country(c.getString(0),c.getString(1),c.getString(2),c.getString(3),c.getInt(4)==1,c.getInt(5)==1));
  }return out;
 }
 private String escape(String s){return s.replace("\\","\\\\").replace("%","\\%").replace("_","\\_");}

 public void save(Quiz q){save(q,owner);}
 public void save(Quiz q,String uid){
  if(!q.complete())throw new IllegalArgumentException("Quiz must be completed.");
  JSONArray answers=new JSONArray();
  for(int i=0;i<q.answers.size();i++)try{answers.put(new JSONObject().put("code",q.questions.get(i).code).put("picked",q.answers.get(i)).put("correct",q.answers.get(i).equals(q.expected(i))));}catch(JSONException e){throw new IllegalStateException(e);}
  saveResult(q.id,q.finished,q.started,q.mode,q.region,q.correct(),q.total(),0,q.report(),answers,uid);
 }
 public void save(MemoryGame g){save(g,owner);}
 public void save(MemoryGame g,String uid){
  if(!g.complete())throw new IllegalArgumentException("Game must be completed.");
  JSONArray answers=new JSONArray();for(Country c:g.countries)try{answers.put(new JSONObject().put("code",c.code).put("picked",c.code).put("correct",true));}catch(JSONException e){throw new IllegalStateException(e);}
  saveResult(g.id,g.finished,g.started,"memory",g.region,g.matched.size(),g.countries.size(),g.moves,g.report(),answers,uid);
 }
 private String gameTitle(String mode){switch(mode){case "capital":return "Capital Quest";case "continent":return "Continent Explorer";case "sprint":return "60-second Sprint";case "memory":return "Flag Match";default:return "Flag Finder";}}
 private void saveResult(String id,long finished,long started,String mode,String region,int correct,int total,int moves,String report,JSONArray answers,String uid){
  long seconds=Math.max(0,(finished-started)/1000);
  try{
   JSONObject payload=new JSONObject().put("id",id).put("created",finished).put("mode",mode).put("region",region).put("correct",correct).put("total",total).put("seconds",seconds).put("points",correct*10).put("moves",moves).put("answers",answers).put("reportText",report);
   ContentValues v=new ContentValues();v.put("id",id);v.put("owner",uid);v.put("completed",finished);v.put("region",gameTitle(mode)+" · "+region);v.put("actual_region",region);v.put("mode",mode);v.put("correct",correct);v.put("total",total);v.put("seconds",seconds);v.put("report",report);v.put("payload",payload.toString());v.put("synced",0);
   getWritableDatabase().insertWithOnConflict("results",null,v,SQLiteDatabase.CONFLICT_IGNORE);
  }catch(JSONException e){throw new IllegalStateException(e);}
 }
 public List<Map<String,Object>> pending(String uid){
  List<Map<String,Object>> rows=new ArrayList<>();
  try(Cursor c=getReadableDatabase().rawQuery("SELECT id,completed,actual_region,correct,total,seconds,report,mode,payload FROM results WHERE owner=? AND synced=0 ORDER BY completed",new String[]{uid})){
   while(c.moveToNext()){
    Map<String,Object> row=new HashMap<>();row.put("id",c.getString(0));row.put("created",c.getLong(1));row.put("region",c.getString(2));row.put("correct",c.getLong(3));row.put("total",c.getLong(4));row.put("seconds",c.getLong(5));row.put("report",c.getString(6));row.put("mode",c.getString(7));row.put("points",c.getLong(3)*10);
    String payload=c.getString(8);
    try{
     JSONObject p=payload.isEmpty()?new JSONObject().put("id",c.getString(0)).put("created",c.getLong(1)).put("region",c.getString(2)).put("correct",c.getLong(3)).put("total",c.getLong(4)).put("seconds",c.getLong(5)).put("reportText",c.getString(6)).put("mode",c.getString(7)).put("answers",new JSONArray()):new JSONObject(payload);
     row.put("moves",p.optLong("moves",0));row.put("payload",p.toString());
    }catch(JSONException e){throw new IllegalStateException(e);}
    rows.add(row);
   }
  }return rows;
 }
 public void markSynced(String id,String uid){ContentValues v=new ContentValues();v.put("synced",1);getWritableDatabase().update("results",v,"id=? AND owner=?",new String[]{id,uid});}
 public void importGuests(String uid){if(uid.equals("guest"))throw new IllegalArgumentException("Sign in first");ContentValues v=new ContentValues();v.put("owner",uid);v.put("synced",0);getWritableDatabase().updateWithOnConflict("results",v,"owner='guest'",null,SQLiteDatabase.CONFLICT_IGNORE);}
 public void clearSynced(String uid){getWritableDatabase().delete("results","owner=? AND synced=1",new String[]{uid});}
 public void cacheCloud(Map<String,Object> row,String uid){
  ContentValues v=new ContentValues();v.put("id",(String)row.get("id"));v.put("owner",uid);v.put("completed",((Number)row.get("created")).longValue());v.put("mode",(String)row.get("mode"));v.put("actual_region",(String)row.get("region"));v.put("region",gameTitle((String)row.get("mode"))+" · "+row.get("region"));v.put("correct",((Number)row.get("correct")).intValue());v.put("total",((Number)row.get("total")).intValue());v.put("seconds",((Number)row.get("seconds")).longValue());v.put("report",(String)row.get("report"));v.put("payload",(String)row.get("payload"));v.put("synced",1);
  getWritableDatabase().insertWithOnConflict("results",null,v,SQLiteDatabase.CONFLICT_REPLACE);
 }
 public int[] stats(){try(Cursor c=getReadableDatabase().rawQuery("SELECT COUNT(*),COALESCE(MAX(correct*10),0),COALESCE(SUM(correct),0),COALESCE(SUM(total),0) FROM results WHERE owner=?",new String[]{owner})){c.moveToFirst();return new int[]{c.getInt(0),c.getInt(1),c.getInt(2),c.getInt(3)};}}
 public List<String[]> history(){List<String[]> out=new ArrayList<>();try(Cursor c=getReadableDatabase().rawQuery("SELECT completed,region,correct,total,seconds,report FROM results WHERE owner=? ORDER BY completed DESC",new String[]{owner})){while(c.moveToNext())out.add(new String[]{c.getString(0),c.getString(1),c.getString(2),c.getString(3),c.getString(4),c.getString(5)});}return out;}
}
