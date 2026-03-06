import { prisma } from "./prisma";
import { getCurrentLanguage } from "./i18n";

export async function ensureOnboardingNoteForUser(userId: string) {
  const noteCount = await prisma.note.count({
    where: { userId },
  });

  if (noteCount > 0) return;

  const lang = await getCurrentLanguage();

  const title =
    lang === "pt"
      ? "Bem-vindo ao seu Knowledge Garden"
      : "Welcome to your Knowledge Garden";

  const contentPt = `# Como usar este jardim

Este espaço é um **garden** de ideias, não um bloco de notas infinito.

- Crie notas curtas, focadas em **uma ideia por vez**.
- Adicione tags leves, como \`projetos\`, \`livros\`, \`ideias\`.
- Use o **Jardim diário** para revisitar notas antigas.

## Resurfacing (revisão)

Quando você revisar uma nota no Jardim diário:

- **De novo**: a nota volta mais cedo.
- **Difícil**: volta em alguns dias.
- **Boa**: o espaçamento aumenta aos poucos.
- **Fácil**: a nota some por mais tempo.

## Notificações

- O sino no topo mostra quantas notas estão “para hoje”.
- O navegador pode mandar lembretes se você permitir notificações.
- Você também pode definir uma **data de lembrete** ao criar notas novas.

Comece criando 2–3 notas pequenas sobre algo que está na sua cabeça agora.`;

  const contentEn = `# How to use this garden

This space is a **garden** of ideas, not an endless scratchpad.

- Create short notes focused on **one idea at a time**.
- Add light tags like \`projects\`, \`books\`, \`ideas\`.
- Use the **Daily Garden** to resurface older notes.

## Resurfacing (review)

When you review a note in the Daily Garden:

- **Again**: the note comes back sooner.
- **Hard**: it returns in a few days.
- **Good**: spacing increases gradually.
- **Easy**: the note disappears for longer.

## Notifications

- The bell in the header shows how many notes are due “today”.
- Your browser can send reminders if you allow notifications.
- You can also set a **reminder date** when creating notes.

Start by creating 2–3 small notes about what’s on your mind right now.`;

  const content = lang === "pt" ? contentPt : contentEn;

  await prisma.note.create({
    data: {
      userId,
      title,
      content,
      importance: 2,
    },
  });
}

