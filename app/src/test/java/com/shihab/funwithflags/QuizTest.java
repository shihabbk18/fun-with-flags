package com.shihab.funwithflags;

import org.junit.Test;
import static org.junit.Assert.*;
import java.util.*;
import java.io.*;

public class QuizTest {
    private List<Country> pool() {
        return Arrays.asList(new Country("BD","Bangladesh","Dhaka","Asia"),new Country("JP","Japan","Tokyo","Asia"),
            new Country("IN","India","New Delhi","Asia"),new Country("CN","China","Beijing","Asia"),new Country("TH","Thailand","Bangkok","Asia"));
    }
    @Test public void questionsAndChoicesAreUniqueAndIncludeCorrectAnswer() {
        for(int seed=0;seed<100;seed++) {
            Quiz q=new Quiz(pool(),20,"Asia",new Random(seed));
            assertEquals(5,q.questions.size());
            Set<String> asked=new HashSet<>();
            for(int i=0;i<q.questions.size();i++) {
                assertTrue(asked.add(q.questions.get(i).code));
                Set<String> options=new HashSet<>();
                for(Country c:q.choices.get(i)) assertTrue(options.add(c.code));
                assertEquals(4,options.size()); assertTrue(options.contains(q.questions.get(i).code));
            }
        }
    }
    @Test public void scoringCannotBeInflatedAndRequiresAnAnswerBeforeAdvancing() {
        Quiz q=new Quiz(pool(),5,"Asia",new Random(1));
        assertFalse(q.next());
        for(int i=0;i<5;i++) {
            assertTrue(q.answer(q.questions.get(i).code));
            assertFalse(q.answer(q.questions.get(i).code));
            q.next();
        }
        assertTrue(q.complete()); assertEquals(50,q.points()); assertEquals(100,q.accuracy());
        assertFalse(q.answer("BD")); assertTrue(q.report().contains("5/5 correct"));
    }
    @Test public void wrongAnswersScoreZeroAndAppearInReport() {
        Quiz q=new Quiz(pool(),1,"Asia",new Random(1));
        Country wrong=q.choices.get(0).stream().filter(c->!c.code.equals(q.questions.get(0).code)).findFirst().get();
        q.answer(wrong.code); q.next();
        assertEquals(0,q.points()); assertTrue(q.report().contains(wrong.name));
    }
    @Test public void rotationRestoresQuestionChoicesAndAnswer() throws Exception {
        Quiz original=new Quiz(pool(),5,"Asia",new Random(3));
        original.answer(original.questions.get(0).code);
        ByteArrayOutputStream bytes=new ByteArrayOutputStream();
        new ObjectOutputStream(bytes).writeObject(original);
        Quiz restored=(Quiz)new ObjectInputStream(new ByteArrayInputStream(bytes.toByteArray())).readObject();
        assertEquals(original.id,restored.id); assertTrue(restored.answered()); assertEquals(10,restored.points());
        assertEquals(original.choices.get(0).get(0).code,restored.choices.get(0).get(0).code);
        assertTrue(restored.next()); assertEquals(1,restored.index);
    }
    @Test(expected=IllegalArgumentException.class) public void invalidAnswerRejected() {
        new Quiz(pool(),5,"Asia",new Random(1)).answer("XX");
    }
    @Test(expected=IllegalArgumentException.class) public void tinyPoolRejected() {
        new Quiz(pool().subList(0,3),5,"Asia",new Random(1));
    }
}
