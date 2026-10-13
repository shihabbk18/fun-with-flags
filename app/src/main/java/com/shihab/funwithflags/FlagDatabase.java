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
 public FlagDatabase(Context context){super(context,"flags.db",null,2);this.context=context.getApplicationContext();}
 @Override public void onCreate(SQLiteDatabase db){
  db.execSQL("CREATE TABLE countries(code TEXT PRIMARY KEY,name TEXT NOT NULL,capital TEXT NOT NULL,continent TEXT NOT NULL,standard INTEGER NOT NULL DEFAULT 1,capital_quiz INTEGER NOT NULL DEFAULT 1)");
  db.execSQL("CREATE TABLE results(id TEXT PRIMARY KEY,completed INTEGER NOT NULL,region TEXT NOT NULL,correct INTEGER NOT NULL,total INTEGER NOT NULL,seconds INTEGER NOT NULL,report TEXT NOT NULL)");
  seed(db);
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
 }
 public List<Country> countries(String region,String search){return countries(region,search,false);}
 public List<Country> countries(String region,String search,boolean onlyCountries){
  List<Country> out=new ArrayList<>();
  try(Cursor c=getReadableDatabase().rawQuery("SELECT code,name,capital,continent,standard,capital_quiz FROM countries WHERE (?='World' OR continent=?) AND (?=0 OR standard=1) AND (name LIKE ? ESCAPE '\\' OR capital LIKE ? ESCAPE '\\' OR code LIKE ? ESCAPE '\\') ORDER BY name",new String[]{region,region,onlyCountries?"1":"0","%"+escape(search)+"%","%"+escape(search)+"%","%"+escape(search)+"%"})){
   while(c.moveToNext())out.add(new Country(c.getString(0),c.getString(1),c.getString(2),c.getString(3),c.getInt(4)==1,c.getInt(5)==1));
  }return out;
 }
 private String escape(String s){return s.replace("\\","\\\\").replace("%","\\%").replace("_","\\_");}
 public void save(Quiz q){if(!q.complete())throw new IllegalArgumentException("Quiz must be completed.");saveResult(q.id,q.finished,q.started,q.title()+" · "+q.region,q.correct(),q.total(),q.report());}
 public void save(MemoryGame g){if(!g.complete())throw new IllegalArgumentException("Game must be completed.");saveResult(g.id,g.finished,g.started,"Flag Match · "+g.region,g.matched.size(),g.countries.size(),g.report());}
 private void saveResult(String id,long finished,long started,String region,int correct,int total,String report){
  ContentValues v=new ContentValues();v.put("id",id);v.put("completed",finished);v.put("region",region);v.put("correct",correct);v.put("total",total);v.put("seconds",Math.max(0,(finished-started)/1000));v.put("report",report);
  getWritableDatabase().insertWithOnConflict("results",null,v,SQLiteDatabase.CONFLICT_IGNORE);
 }
 public int[] stats(){try(Cursor c=getReadableDatabase().rawQuery("SELECT COUNT(*),COALESCE(MAX(correct*10),0),COALESCE(SUM(correct),0),COALESCE(SUM(total),0) FROM results",null)){c.moveToFirst();return new int[]{c.getInt(0),c.getInt(1),c.getInt(2),c.getInt(3)};}}
 public List<String[]> history(){List<String[]> out=new ArrayList<>();try(Cursor c=getReadableDatabase().rawQuery("SELECT completed,region,correct,total,seconds,report FROM results ORDER BY completed DESC",null)){while(c.moveToNext())out.add(new String[]{c.getString(0),c.getString(1),c.getString(2),c.getString(3),c.getString(4),c.getString(5)});}return out;}
}
