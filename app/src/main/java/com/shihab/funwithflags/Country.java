package com.shihab.funwithflags;
import java.io.Serializable;
public class Country implements Serializable {
 private static final long serialVersionUID=1L;
 public final String code,name,capital,continent;
 public final boolean standard,capitalQuiz;
 public Country(String code,String name,String capital,String continent){this(code,name,capital,continent,true,true);}
 public Country(String code,String name,String capital,String continent,boolean standard,boolean capitalQuiz){this.code=code;this.name=name;this.capital=capital;this.continent=continent;this.standard=standard;this.capitalQuiz=capitalQuiz;}
 public String flag(){StringBuilder s=new StringBuilder();for(char c:code.toCharArray())s.appendCodePoint(0x1F1E6+c-'A');return s.toString();}
}
