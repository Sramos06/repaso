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

// Snapshots of a note's previous text, for undo. Pruned to the newest 30.
export const noteRevisions = pgTable("note_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  contentMd: text("content_md").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// One row per study-open (written by POST /api/reviewers/[id]/open). Nothing
// reads it yet; it accrues history so a future stats screen starts with data.
export const openEvents = pgTable("open_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  reviewerId: uuid("reviewer_id").notNull().references(() => reviewers.id, { onDelete: "cascade" }),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
});
