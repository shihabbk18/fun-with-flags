package com.shihab.funwithflags;
import java.io.Serializable;
import java.util.*;
public class MemoryGame implements Serializable {
 private static final long serialVersionUID=1L;
 public static class Card implements Serializable {
  private static final long serialVersionUID=1L;
  public final Country country;public final boolean flag;
  Card(Country country,boolean flag){this.country=country;this.flag=flag;}
 }
 public final String id=UUID.randomUUID().toString(),region;
 public final long started=System.currentTimeMillis();
 public final List<Card> cards=new ArrayList<>();
 public final Set<String> matched=new HashSet<>();
 public final List<Country> countries;
 public int first=-1,second=-1,moves=0;
 public long finished=0;
 public MemoryGame(List<Country> pool,String region,Random random){
  if(pool.isEmpty())throw new IllegalArgumentException("No entries in this region.");
  this.region=region;List<Country> selected=new ArrayList<>(pool);Collections.shuffle(selected,random);
  countries=new ArrayList<>(selected.subList(0,Math.min(6,selected.size())));
  for(Country c:countries){cards.add(new Card(c,true));cards.add(new Card(c,false));}
  Collections.shuffle(cards,random);
 }
 public boolean flip(int i){
  if(i<0||i>=cards.size()||second!=-1||i==first||matched.contains(cards.get(i).country.code)||complete())return false;
  if(first==-1){first=i;return true;}
  second=i;moves++;
  if(cards.get(first).country.code.equals(cards.get(second).country.code)){
   matched.add(cards.get(first).country.code);first=-1;second=-1;
   if(matched.size()==countries.size())finished=System.currentTimeMillis();
  }
  return true;
 }
 public boolean revealed(int i){return i==first||i==second||matched.contains(cards.get(i).country.code);}
 public void hide(){first=-1;second=-1;}
 public boolean complete(){return finished!=0;}
 public String report(){StringBuilder s=new StringBuilder("Fun with Flags — Flag Match\n"+region+" · "+matched.size()*10+" points\n"+matched.size()+" pairs in "+moves+" turns\n\n");for(Country c:countries)s.append(c.name).append(" · ").append(c.capital).append("\n");return s.toString();}
}
