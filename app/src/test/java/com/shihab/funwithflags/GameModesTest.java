package com.shihab.funwithflags;
import org.junit.Test;
import static org.junit.Assert.*;
import java.util.*;
public class GameModesTest {
 private List<Country> pool(){return Arrays.asList(
  new Country("BD","Bangladesh","Dhaka","Asia"),
  new Country("IN","India","New Delhi","Asia"),
  new Country("FR","France","Paris","Europe"),
  new Country("BR","Brazil","Brasília","South America"),
  new Country("US","United States","Washington, D.C.","North America"),
  new Country("AU","Australia","Canberra","Oceania"));}
 @Test public void capitalAndContinentGamesScoreAndExplainCorrectly(){
  for(String mode:new String[]{"capital","continent"}){
   Quiz q=new Quiz(pool(),pool(),5,"World",mode,new Random(1));
   for(int i=0;i<q.questions.size();i++){
    Set<String> labels=new HashSet<>();for(Country c:q.choices.get(i))assertTrue(labels.add(q.label(c)));
    assertEquals(4,labels.size());assertTrue(q.answer(q.expected(i)));q.next();
   }
   assertEquals(50,q.points());assertEquals(100,q.accuracy());assertTrue(q.report().contains(q.title()));
  }
 }
 @Test public void sprintDeadlineAndEmptyResultAreSafe(){
  Quiz q=new Quiz(pool(),pool(),5,"World","sprint",new Random(1));
  assertFalse(q.expired(q.started+59999));assertTrue(q.expired(q.started+60000));
  q.finish(q.started+90000);assertEquals(60000,q.finished-q.started);
  assertEquals(0,q.total());assertEquals(0,q.accuracy());assertFalse(q.answer(q.expected(0)));
 }
 @Test public void matchingPreventsSameCardAndCountsTurns(){
  MemoryGame g=new MemoryGame(pool(),"World",new Random(1));
  assertEquals(12,g.cards.size());assertTrue(g.flip(0));assertFalse(g.flip(0));
  int wrong=0;while(g.cards.get(wrong).country.code.equals(g.cards.get(0).country.code))wrong++;
  assertTrue(g.flip(wrong));assertEquals(1,g.moves);assertFalse(g.flip(1));g.hide();
  for(Country c:g.countries){
   int first=-1,second=-1;for(int i=0;i<g.cards.size();i++)if(g.cards.get(i).country.code.equals(c.code)){if(first==-1)first=i;else second=i;}
   assertTrue(g.flip(first));assertTrue(g.flip(second));assertFalse(g.flip(first));
  }
  assertTrue(g.complete());assertEquals(6,g.matched.size());assertEquals(7,g.moves);
 }
}
