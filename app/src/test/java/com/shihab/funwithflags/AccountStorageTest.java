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
}
