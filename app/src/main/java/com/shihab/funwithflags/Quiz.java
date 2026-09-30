package com.shihab.funwithflags;

import java.io.Serializable;
import java.util.*;

public class Quiz implements Serializable {
    private static final long serialVersionUID = 1L;
    public final String id=UUID.randomUUID().toString();
    public final long started=System.currentTimeMillis();
    public final String region;
    public final List<Country> questions;
    public final List<List<Country>> choices=new ArrayList<>();
    public final List<String> answers=new ArrayList<>();
    public int index=0;
    public long finished=0;

    public Quiz(List<Country> pool, int count, String region, Random random) {
        if (pool.size()<4 || count<1) throw new IllegalArgumentException("At least four countries and one question are required.");
        this.region=region;
        List<Country> shuffled=new ArrayList<>(pool);
        Collections.shuffle(shuffled,random);
        questions=new ArrayList<>(shuffled.subList(0,Math.min(count,pool.size())));
        for (Country correct:questions) {
            List<Country> options=new ArrayList<>(pool);
            options.removeIf(c->c.code.equals(correct.code));
            Collections.shuffle(options,random);
            options=new ArrayList<>(options.subList(0,3));
            options.add(correct);
            Collections.shuffle(options,random);
            choices.add(options);
        }
    }
    public boolean answered() { return answers.size()>index; }
    public boolean answer(String code) {
        if (answered() || complete()) return false;
        boolean valid=false;
        for(Country c:choices.get(index)) if(c.code.equals(code)) valid=true;
        if(!valid) throw new IllegalArgumentException("Answer is not one of the choices.");
        answers.add(code);
        return true;
    }
    public boolean next() {
        if (!answered()) return false;
        if(index+1<questions.size()) { index++; return true; }
        if(finished==0) finished=System.currentTimeMillis();
        return false;
    }
    public boolean complete() { return finished!=0; }
    public int correct() {
        int total=0;
        for(int i=0;i<answers.size();i++) if(answers.get(i).equals(questions.get(i).code)) total++;
        return total;
    }
    public int points() { return correct()*10; }
    public int accuracy() { return Math.round(100f*correct()/questions.size()); }
    public String report() {
        StringBuilder out=new StringBuilder("Fun with Flags\n"+region+" quiz · "+points()+" points\n"+correct()+"/"+questions.size()+" correct ("+accuracy()+"%)\n\n");
        for(int i=0;i<answers.size();i++) {
            Country q=questions.get(i);
            String picked=answers.get(i);
            for(Country c:choices.get(i)) if(c.code.equals(picked)) picked=c.name;
            out.append(i+1).append(". ").append(q.name).append(" — your answer: ").append(picked)
                .append(answers.get(i).equals(q.code)?" ✓":" ✗").append("\n");
        }
        return out.toString();
    }
}
