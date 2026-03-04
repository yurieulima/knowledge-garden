import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/user";
import { computeResurfacingWindow, endOfToday } from "@/lib/resurfacing";

export default async function Home() {
  const user = await getOrCreateDemoUser();
  const { staleBefore } = computeResurfacingWindow();

  const [totalNotes, dueToday, latestNotes] = await Promise.all([
    prisma.note.count({
      where: { userId: user.id, isArchived: false },
    }),
    prisma.note.count({
      where: {
        userId: user.id,
        isArchived: false,
        OR: [
          { nextReviewAt: { lte: endOfToday() } },
          {
            AND: [
              { nextReviewAt: null },
              { createdAt: { lte: staleBefore } },
            ],
          },
        ],
      },
    }),
    prisma.note.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-[0_0_0_1px_rgba(24,24,27,0.7)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
              Welcome back to your garden.
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Capture living notes, tag them lightly, and let old ideas
              resurface each day.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/notes/new"
              className="inline-flex items-center justify-center rounded-full bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-zinc-200"
            >
              New note
            </Link>
            <Link
              href="/garden"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-emerald-400"
            >
              Open daily garden
            </Link>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Notes
            </div>
            <div className="mt-2 text-2xl font-semibold text-zinc-50">
              {totalNotes}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Active, unarchived notes in your garden.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Due today
            </div>
            <div className="mt-2 text-2xl font-semibold text-emerald-400">
              {dueToday}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Older notes ready to be resurfaced.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Rhythm
            </div>
            <div className="mt-2 text-sm text-zinc-300">
              Spend a few minutes in the{" "}
              <span className="font-medium text-emerald-400">
                Daily Garden
              </span>{" "}
              to keep ideas fresh.
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-200">
            Recent notes
          </h2>
          <Link
            href="/notes"
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            View all
          </Link>
        </div>
        {latestNotes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-500">
            No notes yet. Create your first note and it will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-900 rounded-xl border border-zinc-900 bg-zinc-950/60">
            {latestNotes.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/notes/${note.id}`}
                  className="block px-4 py-3 hover:bg-zinc-900/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-50">
                        {note.title || "Untitled note"}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                        {note.content || "Empty note"}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                      {note.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

