package com.shihab.funwithflags;

import java.io.Serializable;

public class Country implements Serializable {
    private static final long serialVersionUID = 1L;
    public final String code, name, capital, continent;
    public Country(String code, String name, String capital, String continent) {
        this.code=code; this.name=name; this.capital=capital; this.continent=continent;
    }
    public String flag() {
        StringBuilder flag=new StringBuilder();
        for (char c:code.toCharArray()) flag.appendCodePoint(0x1F1E6+c-'A');
        return flag.toString();
    }
}
