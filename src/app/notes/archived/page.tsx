import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/user";
import { getCurrentLanguage } from "@/lib/i18n";

export default async function ArchivedNotesPage() {
  const user = await getOrCreateDemoUser();
  const lang = await getCurrentLanguage();

  const t =
    lang === "pt"
      ? {
          title: "Notas arquivadas",
          subtitle:
            "Notas que você colocou na prateleira. Desarquive qualquer uma que volte a ser relevante.",
          back: "Voltar para notas ativas",
          empty: "Você ainda não tem notas arquivadas.",
          untitled: "Nota sem título",
          emptyNote: "Nota vazia",
          updated: "Atualizada",
        }
      : {
          title: "Archived notes",
          subtitle:
            "Notes you’ve put on the shelf. Unarchive anything that becomes relevant again.",
          back: "Back to active notes",
          empty: "You don’t have any archived notes yet.",
          untitled: "Untitled note",
          emptyNote: "Empty note",
          updated: "Updated",
        };

  const notes = await prisma.note.findMany({
    where: { userId: user.id, isArchived: true },
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{t.subtitle}</p>
        </div>
        <Link
          href="/notes"
          className="text-xs font-medium text-zinc-400 hover:text-zinc-100"
        >
          {t.back}
        </Link>
      </div>

      {notes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-500">
          {t.empty}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-900 overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/60">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="block px-4 py-3 hover:bg-zinc-900/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-zinc-50">
                      {note.title || t.untitled}
                    </p>
                    <p className="line-clamp-1 text-xs text-zinc-500">
                      {note.content || t.emptyNote}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                      {t.updated}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      {note.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


