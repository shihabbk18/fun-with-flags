package com.shihab.funwithflags;

import android.app.*;
import android.os.Bundle;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.*;
import android.widget.*;
import android.text.*;
import java.text.DateFormat;
import java.util.*;

public class MainActivity extends Activity {
    private static final int INK=0xFF163D32, GREEN=0xFF236B54, CREAM=0xFFF7F7EF, MUTED=0xFF68776E, GOLD=0xFFF5C75E;
    private FlagDatabase db;
    private LinearLayout root, body, navigation;
    private Quiz quiz;
    private MemoryGame memory;
    private String mode="flag";
    private boolean onlyCountries=false;
    private TextView timerLabel;
    private final android.os.Handler timerHandler=new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable timerTick=new Runnable(){public void run(){
        if(screen.equals("quiz") && quiz!=null && quiz.mode.equals("sprint") && !quiz.complete()){
            if(quiz.expired()){quiz.finish();saveQuiz();}
            else if(timerLabel!=null)timerLabel.setText("Time left: "+Math.max(0,(quiz.started+60000-System.currentTimeMillis()+999)/1000)+" seconds");
        }
        timerHandler.postDelayed(this,250);
    }};
    @Override protected void onResume(){super.onResume();timerHandler.post(timerTick);}
    @Override protected void onPause(){timerHandler.removeCallbacks(timerTick);super.onPause();}
    private String screen="home", region="World";
    private int questionCount=10;
    private final String[] regions={"World","Asia","Europe","Africa","North America","South America","Oceania","Antarctica"};

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        db=new FlagDatabase(this);
        if(state!=null) {
            quiz=(Quiz)state.getSerializable("quiz");
            screen=state.getString("screen","home"); region=state.getString("region","World");
            questionCount=state.getInt("count",10);
            mode=state.getString("mode","flag");onlyCountries=state.getBoolean("onlyCountries",false);
            memory=(MemoryGame)state.getSerializable("memory");
        }
        render();
    }
    @Override protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        out.putSerializable("quiz",quiz); out.putString("screen",screen);
        out.putString("region",region); out.putInt("count",questionCount);out.putString("mode",mode);out.putBoolean("onlyCountries",onlyCountries);out.putSerializable("memory",memory);
    }
    @Override protected void onDestroy() { db.close(); super.onDestroy(); }
    private int dp(float n) { return (int)(n*getResources().getDisplayMetrics().density+0.5f); }
    private GradientDrawable background(int color,int radius) {
        GradientDrawable d=new GradientDrawable(); d.setColor(color); d.setCornerRadius(dp(radius)); return d;
    }
    private TextView text(String value,int size,int color,boolean bold) {
        TextView t=new TextView(this); t.setText(value); t.setTextSize(size); t.setTextColor(color);
        if(bold) t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        t.setPadding(0,dp(5),0,dp(5)); return t;
    }
    private void gap(LinearLayout box,int height) { View v=new View(this); box.addView(v,new LinearLayout.LayoutParams(1,dp(height))); }
    private LinearLayout card(LinearLayout parent,int color) {
        LinearLayout c=new LinearLayout(this); c.setOrientation(LinearLayout.VERTICAL); c.setPadding(dp(20),dp(18),dp(20),dp(18));
        c.setBackground(background(color,24));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2); p.bottomMargin=dp(14); parent.addView(c,p); return c;
    }
    private Button button(LinearLayout parent,String title,int color,int foreground,Runnable action) {
        Button b=new Button(this); b.setText(title); b.setTextSize(16); b.setAllCaps(false); b.setTextColor(foreground);
        b.setTypeface(Typeface.DEFAULT,Typeface.BOLD); b.setBackground(background(color,16));
        b.setPadding(dp(16),dp(12),dp(16),dp(12)); b.setMinHeight(dp(52));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2); p.topMargin=dp(8); p.bottomMargin=dp(4);
        parent.addView(b,p); b.setOnClickListener(v->action.run()); return b;
    }
    private void go(String target) { screen=target; render(); }
    private void render() {
        timerLabel=null;
        root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(CREAM);
        root.setOnApplyWindowInsetsListener((view,insets)->{
            view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });
        setContentView(root); root.requestApplyInsets();
        ScrollView scroll=new ScrollView(this); scroll.setFillViewport(true);
        body=new LinearLayout(this); body.setOrientation(LinearLayout.VERTICAL); body.setPadding(dp(24),dp(20),dp(24),dp(20));
        scroll.addView(body); root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        TextView brand=text("⚑  FUN WITH FLAGS",13,GREEN,true); brand.setLetterSpacing(.12f); body.addView(brand); gap(body,16);
        switch(screen) {
            case "learn": learn(); break;
            case "setup": setup(); break;
            case "quiz": if(quiz!=null){if(quiz.complete()){result();button(body,"Retry saving result",GREEN,Color.WHITE,this::saveQuiz);}else question();} else home(); break;
            case "result": if(quiz!=null && quiz.complete()) result(); else home(); break;
            case "history": history(); break;
            case "memory": memoryScreen(); break;
            default: home();
        }
        if(!screen.equals("quiz") && !screen.equals("memory")) nav();
    }
    private void heading(String title,String subtitle) {
        body.addView(text(title,34,INK,true)); body.addView(text(subtitle,15,MUTED,false)); gap(body,20);
    }
    private void nav() {
        navigation=new LinearLayout(this); navigation.setPadding(dp(12),dp(8),dp(12),dp(10)); navigation.setBackgroundColor(Color.WHITE);
        String[] labels={"Home","Learn","Quiz","History"}, targets={"home","learn","setup","history"};
        for(int i=0;i<labels.length;i++) {
            final String target=targets[i];
            TextView item=text(labels[i],14,screen.equals(target)?GREEN:MUTED,screen.equals(target));
            item.setGravity(Gravity.CENTER); item.setMinHeight(dp(48)); item.setContentDescription(labels[i]+" tab");
            if(screen.equals(target)) item.setBackground(background(0xFFE7EFE8,14));
            navigation.addView(item,new LinearLayout.LayoutParams(0,-2,1)); item.setOnClickListener(v->go(target));
        }
        root.addView(navigation);
    }
    private void home() {
        heading("Small flags.\nA whole world.","A little curiosity goes a long way.");
        LinearLayout hero=card(body,GREEN);
        hero.addView(text("YOUR NEXT ADVENTURE",12,0xFFCAE5CC,true));
        TextView flags=text("🇧🇩   🇯🇵   🇧🇷",42,Color.WHITE,false); flags.setGravity(Gravity.CENTER); hero.addView(flags);
        hero.addView(text("How well do you\nknow the world?",28,Color.WHITE,true));
        hero.addView(text("Pick a flag. Find its country.\nLearn something new along the way.",16,0xFFE1EEE2,false));
        button(hero,"Let’s play  →",GOLD,INK,()->go("setup"));
        int[] s=db.stats();
        LinearLayout stat=card(body,Color.WHITE);
        stat.addView(text("YOUR PASSPORT",12,MUTED,true));
        stat.addView(text(s[0]+" quizzes   ·   "+s[1]+" best score",22,INK,true));
        stat.addView(text(s[3]==0?"Your first discovery is one quiz away.":Math.round(100f*s[2]/s[3])+"% lifetime accuracy · "+s[2]+" correct answers",14,MUTED,false));
        LinearLayout explore=card(body,0xFFF0EAD8);
        explore.addView(text("250 places. Five ways to play.",22,INK,true));
        explore.addView(text("Explore all 195 UN member/observer countries, plus territories and other places. Play flags, capitals, continents, sprint, or matching.",15,MUTED,false));
        button(explore,"Explore the flag library",Color.WHITE,INK,()->go("learn"));
        body.addView(text("OFFLINE BY DESIGN  ·  NO ADS  ·  JUST CURIOSITY",10,MUTED,true));
    }
    private Spinner regionPicker(LinearLayout parent,Runnable changed) {
        Spinner spinner=new Spinner(this);
        spinner.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,regions));
        spinner.setPadding(dp(8),dp(8),dp(8),dp(8)); spinner.setMinimumHeight(dp(48)); spinner.setBackground(background(Color.WHITE,12));
        parent.addView(spinner,new LinearLayout.LayoutParams(-1,-2));
        spinner.setSelection(Arrays.asList(regions).indexOf(region));
        spinner.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
            public void onItemSelected(android.widget.AdapterView<?> p,View v,int pos,long id) { region=regions[pos]; changed.run(); }
            public void onNothingSelected(android.widget.AdapterView<?> p) {}
        });
        return spinner;
    }
    private void learn() {
        heading("The flag library","Meet the world, one country at a time.");
        EditText search=new EditText(this); search.setSingleLine(); search.setTextSize(16); search.setHint("Search country or capital");
        search.setPadding(dp(16),dp(12),dp(16),dp(12)); search.setBackground(background(Color.WHITE,14));
        body.addView(search,new LinearLayout.LayoutParams(-1,-2)); gap(body,12);
        LinearLayout filters=new LinearLayout(this); filters.setOrientation(LinearLayout.VERTICAL); body.addView(filters);
        gap(body,16);
        LinearLayout list=new LinearLayout(this); list.setOrientation(LinearLayout.VERTICAL); body.addView(list);
        Runnable refresh=()->{
            list.removeAllViews();
            List<Country> countries=db.countries(region,search.getText().toString().trim(),onlyCountries);
            list.addView(text(countries.size()+" entries to discover",13,MUTED,false)); gap(list,8);
            for(Country c:countries) {
                LinearLayout row=card(list,Color.WHITE);
                row.addView(text(c.flag()+"   "+c.name,23,INK,true));
                row.addView(text(c.capital+"  ·  "+c.continent+" · "+(c.standard?"Country":"Territory / other entry"),14,MUTED,false));
                row.setContentDescription(c.name+", capital "+c.capital+", "+c.continent+". Tap to learn.");
                row.setFocusable(true); row.setOnClickListener(v->new AlertDialog.Builder(this).setTitle(c.flag()+" "+c.name)
                    .setMessage("Capital / seat of government: "+c.capital+"\nContinent: "+c.continent+"\nCountry code: "+c.code+"\n\nLook closely at the flag’s colors and shapes. Try recalling the country before your next quiz.")
                    .setPositiveButton("Got it",null).show());
            }
            if(countries.isEmpty()) list.addView(text("No countries found. Try a different search or continent.",18,INK,false));
        };
        regionPicker(filters,refresh);
        CheckBox scope=new CheckBox(this);scope.setText("195 countries only");scope.setChecked(onlyCountries);filters.addView(scope);scope.setOnCheckedChangeListener((v,checked)->{onlyCountries=checked;refresh.run();});
        search.addTextChangedListener(new TextWatcher(){
            public void beforeTextChanged(CharSequence s,int start,int count,int after){}
            public void onTextChanged(CharSequence s,int start,int before,int count){refresh.run();}
            public void afterTextChanged(Editable e){}
        });
        refresh.run();
    }
    private void setup() {
        heading("Ready to explore?","Five games. The whole world.");
        body.addView(text("Choose a game",20,INK,true));
        Spinner gameType=new Spinner(this);gameType.setMinimumHeight(dp(48));
        String[] modeIds={"flag","capital","continent","sprint","memory"};
        String[] modeNames={"Flag Finder","Capital Quest","Continent Explorer","60-second Sprint","Flag Match"};
        gameType.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,modeNames));
        gameType.setSelection(Arrays.asList(modeIds).indexOf(mode));body.addView(gameType);
        gameType.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){
            public void onItemSelected(android.widget.AdapterView<?> p,View v,int pos,long id){mode=modeIds[pos];}
            public void onNothingSelected(android.widget.AdapterView<?> p){}
        });
        CheckBox scope=new CheckBox(this);scope.setText("195 countries only");scope.setChecked(onlyCountries);body.addView(scope);scope.setOnCheckedChangeListener((v,checked)->onlyCountries=checked);
        LinearLayout c=card(body,Color.WHITE);
        c.addView(text("01  Choose a continent",20,INK,true));
        regionPicker(c,()->{});
        gap(c,18); c.addView(text("02  Pick your pace",20,INK,true));
        Spinner count=new Spinner(this); count.setMinimumHeight(dp(48));
        count.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,new String[]{"5 questions · Quick trip","10 questions · Explorer","20 questions · World tour","50 questions · Expedition"}));
        count.setSelection(questionCount==5?0:questionCount==20?2:questionCount==50?3:1);
        c.addView(count);
        count.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){
            public void onItemSelected(android.widget.AdapterView<?> p,View v,int pos,long id){questionCount=new int[]{5,10,20,50}[pos];}
            public void onNothingSelected(android.widget.AdapterView<?> p){}
        });
        gap(c,12); c.addView(text("10 points per correct answer or matched pair. Sprint lasts 60 seconds; matching uses up to 6 pairs. Length applies to other quizzes. The 195-country set is UN members plus Palestine and Vatican City. Extended entries follow the dataset.",15,MUTED,false));
        button(body,"Start my quiz  →",GREEN,Color.WHITE,()->{
            try {
                List<Country> pool=db.countries(region,"",onlyCountries);
                if(mode.equals("memory")){memory=new MemoryGame(pool,region,new Random());go("memory");}
                else {quiz=new Quiz(pool,db.countries("World",""),questionCount,region,mode,new Random());go("quiz");}
            } catch(IllegalArgumentException error){new AlertDialog.Builder(this).setTitle("Choose another route").setMessage(error.getMessage()).setPositiveButton("OK",null).show();}
        });
    }
    private void question() {
        Country country=quiz.questions.get(quiz.index);
        body.addView(text(quiz.title()+" / "+quiz.region.toUpperCase(Locale.ROOT)+"  /  QUESTION "+(quiz.index+1)+" OF "+quiz.questions.size(),12,GREEN,true));
        ProgressBar progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);
        progress.setMax(quiz.questions.size()); progress.setProgress(quiz.answers.size()); body.addView(progress,new LinearLayout.LayoutParams(-1,dp(8)));
        gap(body,18); body.addView(text(quiz.mode.equals("capital")?"Which is its capital?":quiz.mode.equals("continent")?"Which continent?":"Whose flag is this?",30,INK,true));
        if(quiz.mode.equals("capital")||quiz.mode.equals("continent"))body.addView(text(country.name,24,INK,true));
        if(quiz.mode.equals("sprint")){timerLabel=text("Time left: "+Math.max(0,(quiz.started+60000-System.currentTimeMillis()+999)/1000)+" seconds",18,GREEN,true);body.addView(timerLabel);}
        body.addView(text(quiz.points()+" points collected",14,MUTED,false));
        LinearLayout flagCard=card(body,Color.WHITE);
        TextView flag=text(country.flag(),96,INK,false); flag.setGravity(Gravity.CENTER); flag.setPadding(0,dp(28),0,dp(28));
        flag.setContentDescription("Flag identification question"); flagCard.addView(flag);
        for(Country option:quiz.choices.get(quiz.index)) {
            int color=Color.WHITE, fg=INK;
            String label=quiz.label(option);
            if(quiz.answered()) {
                if(option.code.equals(quiz.expected(quiz.index))) { color=0xFFDCEBDD; label="✓  "+label; }
                else if(option.code.equals(quiz.answers.get(quiz.index))) { color=0xFFF9DED6; label="✕  "+label; }
            }
            Button answer=button(body,label,color,fg,()->{
                if(quiz.expired()){quiz.finish();saveQuiz();return;}
                if(quiz.answer(option.code)&&quiz.mode.equals("sprint")){
                    android.widget.Toast.makeText(this,quiz.answers.get(quiz.index).equals(quiz.expected(quiz.index))?"Correct!":"It was "+country.name,android.widget.Toast.LENGTH_SHORT).show();
                    if(quiz.next())render();else saveQuiz();
                }else render();
            });
            answer.setEnabled(!quiz.answered());
        }
        if(quiz.answered()) {
            gap(body,12);
            boolean correct=quiz.answers.get(quiz.index).equals(quiz.expected(quiz.index));
            body.addView(text(correct?"Nice work! +10 points":"A new flag for your memory.",20,GREEN,true));
            body.addView(text(country.name+" · "+country.capital+" · "+country.continent,16,INK,false));
            button(body,quiz.index+1==quiz.questions.size()?"See my results  →":"Next flag  →",GREEN,Color.WHITE,()->{
                if(quiz.next()) render();
                else {
                    try { db.save(quiz); go("result"); }
                    catch(android.database.SQLException error) {
                        new AlertDialog.Builder(this).setTitle("Couldn’t save your result").setMessage("Your answers are still here. Free some device storage and tap See my results to try again.").setPositiveButton("OK",null).show();
                    }
                }
            });
        }
        button(body,"Leave quiz",CREAM,MUTED,this::leaveQuiz);
    }
    private void result() {
        heading(quiz.accuracy()>=80?"World-class curiosity!":"Another journey complete.",quiz.title()+" · "+quiz.region);
        LinearLayout score=card(body,GREEN);
        score.addView(text("YOUR EXPEDITION REPORT",12,0xFFCAE5CC,true));
        score.addView(text(quiz.points()+" points",46,Color.WHITE,true));
        score.addView(text(quiz.correct()+" / "+quiz.total()+" correct   ·   "+quiz.accuracy()+"% accuracy",18,Color.WHITE,true));
        score.addView(text(screen.equals("result")?"Saved to your history":"Result not yet saved",14,0xFFCAE5CC,false));
        button(body,"Play again",GREEN,Color.WHITE,()->go("setup"));
        button(body,"Share result report",Color.WHITE,INK,()->share(quiz.report()));
        gap(body,20); body.addView(text("A look back",24,INK,true));
        for(int i=0;i<quiz.answers.size();i++) {
            Country c=quiz.questions.get(i); boolean correct=quiz.answers.get(i).equals(quiz.expected(i));
            LinearLayout row=card(body,Color.WHITE); row.addView(text(c.flag()+"  "+c.name+"  "+(correct?"✓":"✕"),21,INK,true));
            String picked="";
            for(Country choice:quiz.choices.get(i)) if(choice.code.equals(quiz.answers.get(i))) picked=quiz.label(choice);
            row.addView(text(correct?"Correct · "+c.capital:"You chose "+picked+"\nCapital: "+c.capital,15,MUTED,false));
        }
    }
    private void history() {
        heading("Your travel journal","Every quiz is a step around the world.");
        List<String[]> rows=db.history();
        if(rows.isEmpty()) {
            LinearLayout empty=card(body,Color.WHITE); empty.addView(text("Your passport is waiting.",24,INK,true));
            empty.addView(text("Finish your first quiz to see saved scores and answer reports here.",16,MUTED,false));
            button(empty,"Take the first trip",GREEN,Color.WHITE,()->go("setup"));
        }
        for(String[] row:rows) {
            LinearLayout c=card(body,Color.WHITE);
            c.addView(text(row[1]+" · "+Integer.parseInt(row[2])*10+" points",23,INK,true));
            c.addView(text(row[2]+"/"+row[3]+" correct · "+row[4]+" seconds",15,MUTED,false));
            c.addView(text(DateFormat.getDateTimeInstance(DateFormat.MEDIUM,DateFormat.SHORT).format(new Date(Long.parseLong(row[0]))),13,MUTED,false));
            button(c,"View answer report",0xFFE7EFE8,GREEN,()->new AlertDialog.Builder(this).setTitle("Quiz report")
                .setMessage(row[5]).setPositiveButton("Done",null).setNeutralButton("Share",(d,w)->share(row[5])).show());
        }
    }

    private void saveQuiz(){
        try{db.save(quiz);go("result");}
        catch(android.database.SQLException error){new AlertDialog.Builder(this).setTitle("Could not save").setMessage("Your result is still here. Retry after freeing some storage.").setPositiveButton("Retry",(d,w)->saveQuiz()).setNegativeButton("Keep result",(d,w)->{screen="quiz";render();button(body,"Retry saving result",GREEN,Color.WHITE,this::saveQuiz);}).show();}
    }
    private void memoryScreen(){
        if(memory==null){go("setup");return;}
        if(memory.complete()){
            heading("A perfect match!","Flag Match · "+memory.region);
            body.addView(text(memory.matched.size()*10+" points",44,GREEN,true));
            body.addView(text(memory.matched.size()+" pairs in "+memory.moves+" turns",22,INK,true));
            try{db.save(memory);body.addView(text("Saved to your history",16,MUTED,false));}
            catch(android.database.SQLException e){button(body,"Retry saving result",GREEN,Color.WHITE,this::render);}
            button(body,"Share result report",GREEN,Color.WHITE,()->share(memory.report()));
            button(body,"Choose another game",Color.WHITE,INK,()->{memory=null;go("setup");});
            button(body,"Home",CREAM,INK,()->go("home"));return;
        }
        heading("Find every flag’s partner.","Match flags to country names. "+memory.matched.size()+"/"+memory.countries.size()+" pairs · "+memory.moves+" turns");
        for(int row=0;row<memory.cards.size();row+=3){
            LinearLayout line=new LinearLayout(this);body.addView(line,new LinearLayout.LayoutParams(-1,-2));
            for(int i=row;i<Math.min(row+3,memory.cards.size());i++){
                final int index=i;MemoryGame.Card c=memory.cards.get(i);boolean open=memory.revealed(i);
                Button b=new Button(this);b.setAllCaps(false);b.setText(open?(c.flag?c.country.flag():c.country.name):"⚑");
                b.setTextSize(open&&c.flag?32:15);b.setTextColor(open?INK:Color.WHITE);b.setBackground(background(open?0xFFE7EFE8:GREEN,12));
                b.setContentDescription(open?(c.flag?c.country.name+" flag":c.country.name):"Hidden card "+(i+1));
                LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,dp(118),1);p.setMargins(dp(3),dp(4),dp(3),dp(4));line.addView(b,p);
                b.setEnabled(!open&&memory.second==-1);b.setOnClickListener(v->{memory.flip(index);render();});
            }
        }
        if(memory.second!=-1){body.addView(text("Not a match. Remember these two!",16,INK,true));button(body,"Try another pair",GREEN,Color.WHITE,()->{memory.hide();render();});}
        button(body,"Leave game",CREAM,MUTED,this::leaveMemory);
    }
    private void leaveMemory(){new AlertDialog.Builder(this).setTitle("Leave this game?").setMessage("Unfinished progress will not be saved.").setNegativeButton("Keep playing",null).setPositiveButton("Leave",(d,w)->{memory=null;go("home");}).show();}

    private void share(String report) {
        Intent intent=new Intent(Intent.ACTION_SEND); intent.setType("text/plain"); intent.putExtra(Intent.EXTRA_TEXT,report);
        startActivity(Intent.createChooser(intent,"Share your flag journey"));
    }
    private void leaveQuiz() {
        new AlertDialog.Builder(this).setTitle("Leave this journey?").setMessage("This unfinished quiz will not be saved.")
            .setNegativeButton("Keep playing",null).setPositiveButton("Leave",(d,w)->{quiz=null;go("home");}).show();
    }
    @Override public void onBackPressed() {
        if(screen.equals("quiz")) leaveQuiz();
        else if(screen.equals("memory")) leaveMemory();
        else if(!screen.equals("home")) go("home");
        else super.onBackPressed();
    }
}
