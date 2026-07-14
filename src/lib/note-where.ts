import { and, eq, isNull } from "drizzle-orm";
import { notes } from "@/db/schema";

// The unique key of a note row: (user, reviewer), where NULL reviewer = the scratchpad.
export function whereForNote(userId: string, reviewerId: string | null) {
  return reviewerId === null
    ? and(eq(notes.userId, userId), isNull(notes.reviewerId))
    : and(eq(notes.userId, userId), eq(notes.reviewerId, reviewerId));
}
