package com.shihab.funwithflags;

import android.content.Context;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import java.util.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28)
public class DatabaseTest {
    private Context context;
    private FlagDatabase db;
    @Before public void setup() {
        context=RuntimeEnvironment.getApplication();
        context.deleteDatabase("flags.db");
        db=new FlagDatabase(context);
    }
    @After public void cleanup() { db.close(); }
    @Test public void catalogIsSeededAndSearchIsFilteredAndEscaped() {
        assertEquals(48,db.countries("World","").size());
        assertEquals(12,db.countries("Asia","").size());
        assertEquals("BD",db.countries("World","dhaka").get(0).code);
        assertEquals(0,db.countries("Europe","Dhaka").size());
        assertEquals(0,db.countries("World","%").size());
        assertEquals(0,db.countries("World","' OR 1=1 --").size());
        for(String region:new String[]{"Asia","Europe","Africa","North America","South America","Oceania"})
            assertTrue(db.countries(region,"").size()>=4);
    }
    @Test public void resultsPersistAfterReopenAndDuplicateSaveIsIgnored() {
        Quiz q=new Quiz(db.countries("World",""),5,"World",new Random(2));
        for(int i=0;i<5;i++) { q.answer(q.questions.get(i).code); q.next(); }
        db.save(q); db.save(q); db.close(); db=new FlagDatabase(context);
        assertArrayEquals(new int[]{1,50,5,5},db.stats());
        assertEquals(1,db.history().size()); assertEquals(q.report(),db.history().get(0)[5]);
    }
    @Test(expected=IllegalArgumentException.class) public void unfinishedQuizCannotBeSaved() {
        db.save(new Quiz(db.countries("World",""),5,"World",new Random(1)));
    }
}
