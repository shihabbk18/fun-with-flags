import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const results=sqliteTable("results",{
 id:text("id").primaryKey(),
 owner:text("owner").notNull(),
 created:integer("created").notNull(),
 region:text("region").notNull(),
 correct:integer("correct").notNull(),
 total:integer("total").notNull(),
 seconds:integer("seconds").notNull(),
 answers:text("answers").notNull()
},table=>[index("idx_results_owner_created").on(table.owner,table.created)]);
