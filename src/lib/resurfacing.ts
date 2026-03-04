import type { Note } from "@prisma/client";

export type ReviewRating = "again" | "hard" | "good" | "easy";

export function startOfToday(base = new Date()) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(base = new Date()) {
  const d = new Date(base);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function computeResurfacingWindow(base = new Date()) {
  const start = startOfToday(base);
  const end = endOfToday(base);
  const staleBefore = new Date(start);
  staleBefore.setDate(staleBefore.getDate() - 7);
  return { start, end, staleBefore };
}

export function computeNextReviewAt(
  note: Pick<Note, "reviewCount" | "lastReviewedAt">,
  rating: ReviewRating,
  now = new Date(),
): Date {
  const nextCount = note.reviewCount + 1;

  let baseDays: number;
  if (nextCount === 1) baseDays = 1;
  else if (nextCount === 2) baseDays = 3;
  else if (nextCount === 3) baseDays = 7;
  else baseDays = Math.min(60, Math.round(nextCount * nextCount * 1.5));

  let modifier = 1;
  switch (rating) {
    case "again":
      modifier = 0.5;
      break;
    case "hard":
      modifier = 0.75;
      break;
    case "good":
      modifier = 1;
      break;
    case "easy":
      modifier = 1.5;
      break;
  }

  const days = Math.max(1, Math.round(baseDays * modifier));
  const next = new Date(now);
  next.setDate(next.getDate() + days);
  return next;
}

