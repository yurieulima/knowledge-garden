import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/user";

async function updateNote(formData: FormData) {
  "use server";

  const user = await getOrCreateDemoUser();
  const id = (formData.get("id") ?? "").toString();

  if (!id) return;

  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id },
    include: {
      tags: true,
    },
  });

  if (!existing) return;

  const title = (formData.get("title") ?? "").toString().trim();
  const content = (formData.get("content") ?? "").toString().trim();
  const rawTags = (formData.get("tags") ?? "").toString();

  const tagNames = rawTags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const tags =
    tagNames.length === 0
      ? []
      : await Promise.all(
          tagNames.map((name) =>
            prisma.tag.upsert({
              where: {
                userId_name: {
                  userId: user.id,
                  name,
                },
              },
              update: {},
              create: {
                userId: user.id,
                name,
              },
            }),
          ),
        );

  await prisma.noteTag.deleteMany({
    where: { noteId: existing.id },
  });

  await prisma.note.update({
    where: { id: existing.id },
    data: {
      title,
      content,
      tags:
        tags.length === 0
          ? undefined
          : {
              create: tags.map((tag) => ({
                tagId: tag.id,
              })),
            },
    },
  });

  redirect(`/notes/${existing.id}`);
}

async function toggleArchive(formData: FormData) {
  "use server";

  const user = await getOrCreateDemoUser();
  const id = (formData.get("id") ?? "").toString();
  const action = (formData.get("action") ?? "").toString();

  if (!id) return;

  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) return;

  const isArchived = action === "archive";

  await prisma.note.update({
    where: { id: existing.id },
    data: { isArchived },
  });

  redirect(isArchived ? "/notes" : `/notes/${existing.id}`);
}

interface NotePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NotePage(props: NotePageProps) {
  const params = await props.params;
  const user = await getOrCreateDemoUser();

  const note = await prisma.note.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!note) {
    notFound();
  }

  const tagValue =
    note.tags && note.tags.length > 0
      ? note.tags.map((t) => t.tag.name).join(", ")
      : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Note
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
              {note.title || "Untitled note"}
            </h1>
            {note.isArchived && (
              <span className="inline-flex items-center rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                Archived
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/notes"
            className="text-xs font-medium text-zinc-400 hover:text-zinc-100"
          >
            Back to notes
          </Link>
          <form action={toggleArchive}>
            <input type="hidden" name="id" value={note.id} />
            <input
              type="hidden"
              name="action"
              value={note.isArchived ? "unarchive" : "archive"}
            />
            <button
              type="submit"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-100"
            >
              {note.isArchived ? "Unarchive" : "Archive"}
            </button>
          </form>
        </div>
      </div>

      <form
        action={updateNote}
        className="space-y-4 rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4"
      >
        <input type="hidden" name="id" value={note.id} />

        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Title
          </label>
          <input
            name="title"
            defaultValue={note.title ?? ""}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Content
          </label>
          <textarea
            name="content"
            rows={12}
            defaultValue={note.content ?? ""}
            className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Tags
          </label>
          <input
            name="tags"
            defaultValue={tagValue}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="research, programming, books"
          />
          <p className="text-[11px] text-zinc-500">
            Comma-separated. Tags help cluster related ideas and resurfacing
            later.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-zinc-500">
            Last touched{" "}
            {note.updatedAt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-zinc-200"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

