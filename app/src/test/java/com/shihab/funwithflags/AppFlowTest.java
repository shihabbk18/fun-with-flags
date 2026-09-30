package com.shihab.funwithflags;

import android.view.*;
import android.widget.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28)
public class AppFlowTest {
    private TextView find(View v,String text) {
        if(v instanceof TextView && ((TextView)v).getText().toString().equals(text)) return (TextView)v;
        if(v instanceof ViewGroup) for(int i=0;i<((ViewGroup)v).getChildCount();i++) {
            TextView found=find(((ViewGroup)v).getChildAt(i),text); if(found!=null) return found;
        }
        return null;
    }
    private void tap(MainActivity a,String label) {
        TextView v=find(a.getWindow().getDecorView(),label); assertNotNull("Missing: "+label,v); v.performClick();
        org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
    }
    @Test public void userCanBrowseFinishQuizAndReadSavedHistory() {
        RuntimeEnvironment.getApplication().deleteDatabase("flags.db");
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity a=controller.get();
            tap(a,"Learn"); assertNotNull(find(a.getWindow().getDecorView(),"The flag library"));
            tap(a,"Quiz"); tap(a,"Start my quiz  →");
            for(int i=0;i<10;i++) {
                ViewGroup content=a.findViewById(android.R.id.content);
                Button option=firstEnabledButton(content); assertNotNull(option); option.performClick();
                if(i==0) { controller.recreate(); a=controller.get(); }
                tap(a,i==9?"See my results  →":"Next flag  →");
            }
            assertNotNull(find(a.getWindow().getDecorView(),"Saved to your history"));
            tap(a,"History"); assertNotNull(find(a.getWindow().getDecorView(),"View answer report"));
            try(FlagDatabase db=new FlagDatabase(a)) { assertEquals(1,db.stats()[0]); }
        }
    }
    private Button firstEnabledButton(View v) {
        if(v instanceof Button && v.isEnabled()) return (Button)v;
        if(v instanceof ViewGroup) for(int i=0;i<((ViewGroup)v).getChildCount();i++) {
            Button found=firstEnabledButton(((ViewGroup)v).getChildAt(i)); if(found!=null) return found;
        }
        return null;
    }
}
