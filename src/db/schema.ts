import { pgTable, text, timestamp, integer, uuid, unique, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  googleSub: text("google_sub").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  theme: text("theme").notNull().default("warm"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviewers = pgTable("reviewers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  htmlContent: text("html_content").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  subject: text("subject"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastOpenedAt: timestamp("last_opened_at"),
  archivedAt: timestamp("archived_at"),
  shareToken: text("share_token").unique(),
  contentText: text("content_text"),
});

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    // null reviewerId = the global scratchpad
    reviewerId: uuid("reviewer_id").references(() => reviewers.id, { onDelete: "cascade" }),
    contentMd: text("content_md").notNull().default(""),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique("notes_user_reviewer_idx").on(t.userId, t.reviewerId).nullsNotDistinct()]
);
