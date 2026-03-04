import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/user";
import { computeResurfacingWindow, endOfToday } from "@/lib/resurfacing";

interface NotesPageProps {
  searchParams: Promise<{
    q?: string;
    tag?: string;
  }>;
}

export default async function NotesPage(props: NotesPageProps) {
  const searchParams = await props.searchParams;
  const q = (searchParams.q ?? "").trim();
  const activeTag = (searchParams.tag ?? "").trim();

  const user = await getOrCreateDemoUser();
  const { staleBefore, end } = computeResurfacingWindow();

  const [notes, tags, dueNotesCount] = await Promise.all([
    prisma.note.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(activeTag
          ? {
              tags: {
                some: {
                  tag: {
                    name: activeTag,
                  },
                },
              },
            }
          : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),
    prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    prisma.note.count({
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
    }),
  ]);

  const todayEnd = endOfToday();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
            Notes
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Search, filter by tag, and keep only what&apos;s alive in your
            garden.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <form
            className="flex items-center gap-2"
            action="/notes"
            method="get"
          >
            <input
              name="q"
              defaultValue={q}
              placeholder="Search notes…"
              className="w-40 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:w-56"
            />
            {activeTag && (
              <input type="hidden" name="tag" value={activeTag} />
            )}
          </form>
          <div className="flex items-center gap-3">
            <Link
              href="/notes/archived"
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-100"
            >
              View archived
            </Link>
            <Link
              href="/notes/new"
              className="inline-flex items-center justify-center rounded-full bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-zinc-200"
            >
              New note
            </Link>
          </div>
        </div>
      </div>

      {dueNotesCount > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-900/60 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-200">
          <p>
            You have{" "}
            <span className="font-semibold">
              {dueNotesCount} note{dueNotesCount === 1 ? "" : "s"}
            </span>{" "}
            to revisit in your daily garden.
          </p>
          <Link
            href="/garden"
            className="shrink-0 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-medium text-zinc-950 hover:bg-emerald-400"
          >
            Review now
          </Link>
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <Link
            href="/notes"
            className={`rounded-full px-2 py-0.5 text-[11px] ${
              !activeTag
                ? "bg-zinc-100 text-zinc-900"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            All tags
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/notes?tag=${encodeURIComponent(tag.name)}${
                q ? `&q=${encodeURIComponent(q)}` : ""
              }`}
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                activeTag === tag.name
                  ? "bg-emerald-500 text-zinc-950"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-100"
              }`}
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {notes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-500">
          {q || activeTag
            ? "No notes match your current search or tag filter."
            : "No notes yet. Create your first note to start growing your garden."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-900 overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/60">
          {notes.map((note) => {
            const due =
              note.nextReviewAt &&
              note.nextReviewAt.getTime() <= todayEnd.getTime();
            const stale =
              !note.nextReviewAt &&
              note.createdAt.getTime() <= staleBefore.getTime();

            return (
              <li key={note.id}>
                <div className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-zinc-900/60">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/notes/${note.id}`}
                        className="truncate text-sm font-medium text-zinc-50 hover:underline"
                      >
                        {note.title || "Untitled note"}
                      </Link>
                      {(due || stale) && (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          Due today
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-xs text-zinc-500">
                      {note.content || "Empty note"}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {note.tags.map(({ tag }) => (
                          <Link
                            key={tag.id}
                            href={`/notes?tag=${encodeURIComponent(tag.name)}`}
                            className="inline-flex items-center rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-100"
                          >
                            #{tag.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                      Updated
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      {note.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


