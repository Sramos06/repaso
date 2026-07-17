// Shapes shared by the local store, the sync engine, and the UI. Pure types only.
import type { Encoding } from "./content-codec";

export type LocalReviewer = {
  id: string; // server uuid, or "local-<uuid>" until first sync
  title: string;
  subject: string | null;
  pinned: boolean;
  archivedAt: string | null; // ISO or null
  createdAt: string; // ISO
  updatedAt: string; // ISO; server stamp once synced, local stamp while pending
  lastOpenedAt: string | null;
  sizeBytes: number; // RAW size (v1.12 rule)
  payload: string; // compressed-at-rest content, same bytes the server stores
  encoding: Encoding;
  hasNotes: boolean;
  pending: boolean; // true until the row exists on the server
};

export type LocalNote = {
  key: string; // reviewerId, or "scratchpad"
  contentMd: string;
  updatedAt: string | null; // last server-confirmed stamp; null = never synced
  dirty: boolean; // local text the server has not confirmed yet
};

export type ReviewerPatch = { title?: string; subject?: string | null; pinned?: boolean; archived?: boolean };

export type Mutation =
  | { kind: "note"; target: string; contentMd: string; baseUpdatedAt: string | null }
  | { kind: "patch"; id: string; patch: ReviewerPatch }
  | { kind: "delete"; id: string }
  | { kind: "upload"; tempId: string; name: string; payload: string; encoding: Encoding }
  | { kind: "open"; id: string };

export type QueuedMutation = Mutation & { seq: number; attempts: number };

// What the upgraded GET /api/reviewers returns per row (Task 3).
export type ServerRow = {
  id: string; title: string; subject: string | null; pinned: boolean;
  archivedAt: string | null; createdAt: string; updatedAt: string;
  lastOpenedAt: string | null; sizeBytes: number; hasNotes: boolean;
};
