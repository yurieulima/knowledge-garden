import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/user";
import {
  computeNextReviewAt,
  computeResurfacingWindow,
  type ReviewRating,
} from "@/lib/resurfacing";

async function reviewNote(formData: FormData) {
  "use server";

  const id = (formData.get("noteId") ?? "").toString();
  const rating = (formData.get("rating") ?? "good").toString() as ReviewRating;
  if (!id) return;

  const note = await prisma.note.findUnique({
    where: { id },
  });

  if (!note) return;

  const now = new Date();
  const nextReviewAt = computeNextReviewAt(note, rating, now);

  await prisma.note.update({
    where: { id },
    data: {
      lastReviewedAt: now,
      nextReviewAt,
      reviewCount: note.reviewCount + 1,
    },
  });

  revalidatePath("/garden");
  revalidatePath("/");
}

async function skipToday(formData: FormData) {
  "use server";

  const id = (formData.get("noteId") ?? "").toString();
  if (!id) return;

  const note = await prisma.note.findUnique({
    where: { id },
  });

  if (!note) return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  await prisma.note.update({
    where: { id },
    data: {
      nextReviewAt: tomorrow,
    },
  });

  revalidatePath("/garden");
  revalidatePath("/");
}

export default async function GardenPage() {
  const user = await getOrCreateDemoUser();
  const { end, staleBefore } = computeResurfacingWindow();

  const notes = await prisma.note.findMany({
    where: {
      userId: user.id,
      isArchived: false,
      OR: [
        { nextReviewAt: { lte: end } },
        {
          AND: [{ nextReviewAt: null }, { createdAt: { lte: staleBefore } }],
        },
      ],
    },
    orderBy: [{ nextReviewAt: "asc" }, { createdAt: "asc" }],
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
          Daily garden
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          A small bundle of older notes to revisit today. Mark each one
          based on how familiar it feels.
        </p>
      </div>

      {notes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-500">
          Nothing is due today. Create more notes, or check back tomorrow
          as older ideas ripen.
        </p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <article
              key={note.id}
              className="space-y-3 rounded-2xl border border-zinc-900 bg-zinc-950/70 p-4"
            >
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-zinc-50">
                    {note.title || "Untitled note"}
                  </h2>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Created{" "}
                    {note.createdAt.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {note.lastReviewedAt && (
                      <>
                        {" · Last seen "}
                        {note.lastReviewedAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </>
                    )}
                  </p>
                </div>
                <p className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  {note.reviewCount === 0
                    ? "First resurfacing"
                    : `Review ${note.reviewCount + 1}`}
                </p>
              </header>

              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                {note.content || "Empty note"}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <form
                  action={reviewNote}
                  className="flex flex-wrap gap-2"
                >
                  <input type="hidden" name="noteId" value={note.id} />
                  <ReviewButton rating="again" label="Again" tone="muted" />
                  <ReviewButton rating="hard" label="Hard" tone="soft" />
                  <ReviewButton rating="good" label="Good" tone="main" />
                  <ReviewButton rating="easy" label="Easy" tone="bright" />
                </form>
                <form action={skipToday}>
                  <input type="hidden" name="noteId" value={note.id} />
                  <button
                    type="submit"
                    className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300"
                  >
                    Skip today
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewButtonProps {
  rating: ReviewRating;
  label: string;
  tone: "muted" | "soft" | "main" | "bright";
}

function ReviewButton({ rating, label, tone }: ReviewButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-medium";

  let colors =
    "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900";
  if (tone === "soft") {
    colors =
      "border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20";
  } else if (tone === "main") {
    colors =
      "border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25";
  } else if (tone === "bright") {
    colors =
      "border border-sky-500/40 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25";
  }

  return (
    <button type="submit" name="rating" value={rating} className={`${base} ${colors}`}>
      {label}
    </button>
  );
}

