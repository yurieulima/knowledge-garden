import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { computeResurfacingWindow } from "@/lib/resurfacing";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ dueCount: 0 });
  }

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

  return NextResponse.json({ dueCount });
}


