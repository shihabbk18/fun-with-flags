package com.shihab.funwithflags;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import java.util.*;
@RunWith(RobolectricTestRunner.class)
@Config(sdk=28)
public class AccountStorageTest {
 private FlagDatabase db;
 @Before public void setup(){RuntimeEnvironment.getApplication().deleteDatabase("flags.db");db=new FlagDatabase(RuntimeEnvironment.getApplication());}
 @After public void cleanup(){db.close();}
 private Quiz completed(){Quiz q=new Quiz(db.countries("World",""),5,"World",new Random(2));for(int i=0;i<5;i++){q.answer(q.expected(i));q.next();}return q;}
 @Test public void localHistoryIsIsolatedAcrossAccountsAndGuestImportIsExplicit(){
  Quiz q=completed();db.save(q,"guest");db.save(q,"alice");
  db.setOwner("alice");assertEquals(1,db.history().size());assertEquals(1,db.pending("alice").size());
  db.setOwner("bob");assertEquals(0,db.history().size());db.importGuests("bob");assertEquals(1,db.history().size());
  db.setOwner("guest");assertEquals(0,db.history().size());db.setOwner("alice");assertEquals(1,db.history().size());
  db.markSynced(q.id,"bob");assertEquals(1,db.pending("alice").size());assertEquals(0,db.pending("bob").size());
  db.clearSynced("bob");db.setOwner("bob");assertEquals(0,db.history().size());db.setOwner("alice");assertEquals(1,db.history().size());
 }
 @Test public void disabledCloudLeavesGuestPlayAvailable(){
  CloudAccount account=new CloudAccount(RuntimeEnvironment.getApplication(),db,()->{});
  assertFalse(account.configured());assertEquals("guest",account.owner());account.close();
 }
 @Test public void upgradingVersionTwoPreservesGuestReportsAndScores(){
  android.database.sqlite.SQLiteDatabase old=RuntimeEnvironment.getApplication().openOrCreateDatabase("flags.db",0,null);
  old.execSQL("CREATE TABLE countries(code TEXT PRIMARY KEY,name TEXT NOT NULL,capital TEXT NOT NULL,continent TEXT NOT NULL,standard INTEGER NOT NULL DEFAULT 1,capital_quiz INTEGER NOT NULL DEFAULT 1)");
  old.execSQL("CREATE TABLE results(id TEXT PRIMARY KEY,completed INTEGER NOT NULL,region TEXT NOT NULL,correct INTEGER NOT NULL,total INTEGER NOT NULL,seconds INTEGER NOT NULL,report TEXT NOT NULL)");
  old.execSQL("INSERT INTO results VALUES(?,?,?,?,?,?,?)",new Object[]{"12345678-1234-1234-1234-123456789abc",1000L,"Capital Quest · World",3,5,20,"Original answer report"});
  old.setVersion(2);old.close();
  assertEquals(1,db.history().size());assertEquals("Original answer report",db.history().get(0)[5]);
  Map<String,Object> row=db.pending("guest").get(0);
  assertEquals("capital",row.get("mode"));assertEquals("World",row.get("region"));assertEquals(30L,row.get("points"));
  db.setOwner("alice");assertEquals(0,db.history().size());
 }
}
