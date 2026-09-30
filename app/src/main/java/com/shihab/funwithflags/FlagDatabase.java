package com.shihab.funwithflags;

import android.content.*;
import android.database.Cursor;
import android.database.sqlite.*;
import java.util.*;

public class FlagDatabase extends SQLiteOpenHelper {
    public FlagDatabase(Context context) { super(context,"flags.db",null,1); }
    @Override public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE countries(code TEXT PRIMARY KEY,name TEXT NOT NULL,capital TEXT NOT NULL,continent TEXT NOT NULL)");
        db.execSQL("CREATE TABLE results(id TEXT PRIMARY KEY,completed INTEGER NOT NULL,region TEXT NOT NULL,correct INTEGER NOT NULL,total INTEGER NOT NULL,seconds INTEGER NOT NULL,report TEXT NOT NULL)");
        String data=
            "BD|Bangladesh|Dhaka|Asia\nIN|India|New Delhi|Asia\nJP|Japan|Tokyo|Asia\nCN|China|Beijing|Asia\nKR|South Korea|Seoul|Asia\nNP|Nepal|Kathmandu|Asia\nPK|Pakistan|Islamabad|Asia\nLK|Sri Lanka|Sri Jayawardenepura Kotte|Asia\nTH|Thailand|Bangkok|Asia\nVN|Vietnam|Hanoi|Asia\nMY|Malaysia|Kuala Lumpur|Asia\nSG|Singapore|Singapore|Asia\n"+
            "FR|France|Paris|Europe\nDE|Germany|Berlin|Europe\nIT|Italy|Rome|Europe\nES|Spain|Madrid|Europe\nPT|Portugal|Lisbon|Europe\nGB|United Kingdom|London|Europe\nIE|Ireland|Dublin|Europe\nSE|Sweden|Stockholm|Europe\nNO|Norway|Oslo|Europe\nFI|Finland|Helsinki|Europe\nCH|Switzerland|Bern|Europe\nGR|Greece|Athens|Europe\n"+
            "EG|Egypt|Cairo|Africa\nNG|Nigeria|Abuja|Africa\nKE|Kenya|Nairobi|Africa\nGH|Ghana|Accra|Africa\nMA|Morocco|Rabat|Africa\nET|Ethiopia|Addis Ababa|Africa\nTZ|Tanzania|Dodoma|Africa\nUG|Uganda|Kampala|Africa\n"+
            "US|United States|Washington, D.C.|North America\nCA|Canada|Ottawa|North America\nMX|Mexico|Mexico City|North America\nCU|Cuba|Havana|North America\nJM|Jamaica|Kingston|North America\nPA|Panama|Panama City|North America\n"+
            "BR|Brazil|Brasília|South America\nAR|Argentina|Buenos Aires|South America\nCL|Chile|Santiago|South America\nPE|Peru|Lima|South America\nCO|Colombia|Bogotá|South America\nUY|Uruguay|Montevideo|South America\n"+
            "AU|Australia|Canberra|Oceania\nNZ|New Zealand|Wellington|Oceania\nFJ|Fiji|Suva|Oceania\nPG|Papua New Guinea|Port Moresby|Oceania";
        for(String row:data.split("\n")) {
            String[] p=row.split("\\|");
            ContentValues v=new ContentValues();
            v.put("code",p[0]); v.put("name",p[1]); v.put("capital",p[2]); v.put("continent",p[3]);
            db.insertOrThrow("countries",null,v);
        }
    }
    @Override public void onUpgrade(SQLiteDatabase db,int oldVersion,int newVersion) {
        throw new IllegalStateException("A migration is required for database version "+newVersion);
    }
    public List<Country> countries(String region,String search) {
        List<Country> out=new ArrayList<>();
        try(Cursor c=getReadableDatabase().rawQuery("SELECT code,name,capital,continent FROM countries WHERE (?='World' OR continent=?) AND (name LIKE ? ESCAPE '\\' OR capital LIKE ? ESCAPE '\\') ORDER BY name",
            new String[]{region,region,"%"+escape(search)+"%","%"+escape(search)+"%"})) {
            while(c.moveToNext()) out.add(new Country(c.getString(0),c.getString(1),c.getString(2),c.getString(3)));
        }
        return out;
    }
    private String escape(String text) { return text.replace("\\","\\\\").replace("%","\\%").replace("_","\\_"); }
    public void save(Quiz quiz) {
        if(!quiz.complete()) throw new IllegalArgumentException("Quiz must be completed.");
        ContentValues v=new ContentValues();
        v.put("id",quiz.id); v.put("completed",quiz.finished); v.put("region",quiz.region); v.put("correct",quiz.correct());
        v.put("total",quiz.questions.size()); v.put("seconds",Math.max(0,(quiz.finished-quiz.started)/1000)); v.put("report",quiz.report());
        getWritableDatabase().insertWithOnConflict("results",null,v,SQLiteDatabase.CONFLICT_IGNORE);
    }
    public int[] stats() {
        try(Cursor c=getReadableDatabase().rawQuery("SELECT COUNT(*),COALESCE(MAX(correct*10),0),COALESCE(SUM(correct),0),COALESCE(SUM(total),0) FROM results",null)) {
            c.moveToFirst(); return new int[]{c.getInt(0),c.getInt(1),c.getInt(2),c.getInt(3)};
        }
    }
    public List<String[]> history() {
        List<String[]> out=new ArrayList<>();
        try(Cursor c=getReadableDatabase().rawQuery("SELECT completed,region,correct,total,seconds,report FROM results ORDER BY completed DESC",null)) {
            while(c.moveToNext()) out.add(new String[]{c.getString(0),c.getString(1),c.getString(2),c.getString(3),c.getString(4),c.getString(5)});
        }
        return out;
    }
}
