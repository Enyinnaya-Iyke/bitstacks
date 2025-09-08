import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { organization, user } from "./auth";

export const story = pgTable("story", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  creatorId: text("creator_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  xpReward: integer("xp_reward").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storySelectSchema = createSelectSchema(story);
export const storyInsertSchema = createInsertSchema(story);

export const xpLogs = pgTable(
  "xp_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    storyId: uuid("story_id")
      .notNull()
      .references(() => story.id, { onDelete: "cascade" }),
    xp: integer("xp").notNull(),
    earnedAt: timestamp("earned_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueXpPerStory: uniqueIndex("unique_xp_per_story").on(
      table.userId,
      table.storyId,
    ),
  }),
);

export const userXpTotals = pgTable("user_xp_totals", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  totalXp: integer("total_xp").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
