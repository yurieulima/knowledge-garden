import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/user";

async function createNote(formData: FormData) {
  "use server";

  const user = await getOrCreateDemoUser();

  const title = (formData.get("title") ?? "").toString().trim();
  const content = (formData.get("content") ?? "").toString().trim();
  const rawTags = (formData.get("tags") ?? "").toString();
   const nextReviewRaw = (formData.get("nextReviewAt") ?? "").toString();

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

  let nextReviewAt: Date | undefined = undefined;
  if (nextReviewRaw) {
    const parsed = new Date(nextReviewRaw);
    if (!Number.isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      nextReviewAt = parsed;
    }
  }

  const note = await prisma.note.create({
    data: {
      userId: user.id,
      title,
      content,
      nextReviewAt,
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

  redirect(`/notes/${note.id}`);
}

export default function NewNotePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
            New note
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Capture a thought. Keep it short, linkable, and easy to resurface.
          </p>
        </div>
      </div>

      <form
        action={createNote}
        className="space-y-4 rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4"
      >
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Title
          </label>
          <input
            name="title"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="What are you thinking about?"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Content
          </label>
          <textarea
            name="content"
            rows={10}
            className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Write a short, focused note. You can always expand later."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Tags
          </label>
          <input
            name="tags"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="research, programming, books"
          />
          <p className="text-[11px] text-zinc-500">
            Comma-separated. Tags help cluster related ideas and resurfacing
            later.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Reminder date
          </label>
          <input
            type="date"
            name="nextReviewAt"
            className="w-full max-w-xs rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <p className="text-[11px] text-zinc-500">
            Optional. If set, this note will appear in your daily garden on or
            after this day and trigger notifications.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-zinc-200"
          >
            Save note
          </button>
        </div>
      </form>
    </div>
  );
}

