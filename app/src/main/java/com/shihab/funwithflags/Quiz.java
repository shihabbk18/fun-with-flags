package com.shihab.funwithflags;
import java.io.Serializable;
import java.util.*;
public class Quiz implements Serializable {
 private static final long serialVersionUID=2L;
 public static final String[] CONTINENTS={"Africa","Asia","Europe","North America","South America","Oceania","Antarctica"};
 public final String id=UUID.randomUUID().toString();
 public final long started=System.currentTimeMillis();
 public final String region,mode;
 public final List<Country> questions;
 public final List<List<Country>> choices=new ArrayList<>();
 public final List<String> answers=new ArrayList<>();
 public int index=0;
 public long finished=0;
 public Quiz(List<Country> pool,int count,String region,Random random){this(pool,pool,count,region,"flag",random);}
 public Quiz(List<Country> pool,List<Country> all,int count,String region,String mode,Random random){
  if(count<1||pool.isEmpty()||all.size()<4)throw new IllegalArgumentException("No entries available for these settings.");
  if(!Arrays.asList("flag","capital","continent","sprint").contains(mode))throw new IllegalArgumentException("Unknown game");
  this.region=region;this.mode=mode;
  List<Country> shuffled=new ArrayList<>(pool);
  if(mode.equals("capital"))shuffled.removeIf(c->!c.capitalQuiz);
  if(shuffled.isEmpty())throw new IllegalArgumentException("No capital questions in this region.");
  Collections.shuffle(shuffled,random);
  questions=new ArrayList<>(shuffled.subList(0,Math.min(mode.equals("sprint")?shuffled.size():count,shuffled.size())));
  for(Country correct:questions){
   List<Country> options=new ArrayList<>();
   if(mode.equals("continent")){
    for(String continent:CONTINENTS)if(!continent.equals(correct.continent))options.add(new Country(continent,continent,"",""));
    Collections.shuffle(options,random);options=new ArrayList<>(options.subList(0,3));
    options.add(new Country(correct.continent,correct.continent,"",""));
   }else{
    List<Country> candidates=new ArrayList<>(all);Collections.shuffle(candidates,random);
    Set<String> used=new HashSet<>();used.add(label(correct));
    for(Country c:candidates)if(!c.code.equals(correct.code)&&(!mode.equals("capital")||c.capitalQuiz)&&used.add(label(c))){options.add(c);if(options.size()==3)break;}
    if(options.size()<3)throw new IllegalArgumentException("Not enough distinct answers.");
    options.add(correct);
   }
   Collections.shuffle(options,random);choices.add(options);
  }
 }
 public String title(){switch(mode){case "capital":return "Capital Quest";case "continent":return "Continent Explorer";case "sprint":return "60-second Sprint";default:return "Flag Finder";}}
 public String label(Country c){return mode.equals("capital")?c.capital:c.name;}
 public String expected(int i){return mode.equals("continent")?questions.get(i).continent:questions.get(i).code;}
 public boolean answered(){return answers.size()>index;}
 public boolean expired(){return expired(System.currentTimeMillis());} public boolean expired(long now){return mode.equals("sprint")&&now>=started+60000;}
 public boolean answer(String code){
  if(answered()||complete()||expired())return false;
  boolean valid=false;for(Country c:choices.get(index))if(c.code.equals(code))valid=true;
  if(!valid)throw new IllegalArgumentException("Answer is not a choice.");
  answers.add(code);return true;
 }
 public boolean next(){
  if(complete()||!answered())return false;
  if(index+1<questions.size()&&!expired()){index++;return true;}
  finish();return false;
 }
 public void finish(){finish(System.currentTimeMillis());} public void finish(long now){if(finished==0)finished=mode.equals("sprint")?Math.min(now,started+60000):now;}
 public boolean complete(){return finished!=0;}
 public int correct(){int n=0;for(int i=0;i<answers.size();i++)if(answers.get(i).equals(expected(i)))n++;return n;}
 public int total(){return mode.equals("sprint")?answers.size():questions.size();}
 public int points(){return correct()*10;}
 public int accuracy(){return total()==0?0:Math.round(100f*correct()/total());}
 public String chosen(int i){for(Country c:choices.get(i))if(c.code.equals(answers.get(i)))return label(c);return "";}
 public String report(){
  StringBuilder s=new StringBuilder("Fun with Flags — "+title()+"\n"+region+" · "+points()+" points\n"+correct()+"/"+total()+" correct ("+accuracy()+"%)\n\n");
  for(int i=0;i<answers.size();i++)s.append(i+1).append(". ").append(questions.get(i).name).append(" — your answer: ").append(chosen(i)).append("; correct: ").append(mode.equals("continent")?questions.get(i).continent:label(questions.get(i))).append(answers.get(i).equals(expected(i))?" ✓":" ✕").append("\n");
  return s.toString();
 }
}
