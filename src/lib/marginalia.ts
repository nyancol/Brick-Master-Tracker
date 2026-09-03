import type { UserRole } from "@/api";

export type InkName =
  | "iron-gall"
  | "red-ochre"
  | "lapis"
  | "verdigris"
  | "oak-gall"
  | "sepia"
  | "graphite";

const KNIGHT_INKS: InkName[] = [
  "iron-gall",
  "red-ochre",
  "lapis",
  "verdigris",
  "oak-gall",
  "sepia",
];

export type GlossAge = "now" | "today" | "yestereve" | "past";

function fnv1a(...parts: number[]): number {
  let hash = 0x811c9dc5;
  for (const part of parts) {
    hash ^= part >>> 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function inkFor(authorId: number, role: UserRole): InkName {
  if (role === "visitor") return "graphite";
  return KNIGHT_INKS[fnv1a(authorId) % KNIGHT_INKS.length];
}

export function tiltFor(authorId: number, commentId: number): number {
  const h = fnv1a(authorId, commentId);
  const unit = (h % 1001) / 1000;
  const tilt = (unit * 2 - 1) * 1.5;
  return Math.round(tilt * 100) / 100;
}

function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function relativeGlossAge(createdAt: number, now: number): GlossAge {
  if (now - createdAt < 60_000) return "now";
  const diffDays = Math.floor((startOfDayMs(now) - startOfDayMs(createdAt)) / 86_400_000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yestereve";
  return "past";
}

export function daysPast(createdAt: number, now: number): number {
  return Math.max(
    1,
    Math.floor((startOfDayMs(now) - startOfDayMs(createdAt)) / 86_400_000),
  );
}
