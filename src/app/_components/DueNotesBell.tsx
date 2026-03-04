import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/user";
import { computeResurfacingWindow } from "@/lib/resurfacing";

export async function DueNotesBell() {
  const user = await getOrCreateDemoUser();
  const { end, staleBefore } = computeResurfacingWindow();

  const dueCount = await prisma.note.count({
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
  });

  if (dueCount === 0) {
    return (
      <Link
        href="/garden"
        className="relative inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
      >
        <span aria-hidden="true">🔔</span>
        <span>Nothing due</span>
      </Link>
    );
  }

  return (
    <Link
      href="/garden"
      className="relative inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
    >
      <span aria-hidden="true">🔔</span>
      <span>
        {dueCount} note{dueCount === 1 ? "" : "s"} due
      </span>
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </Link>
  );
}

