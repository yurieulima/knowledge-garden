import { revalidatePath } from "next/cache";
import { getCurrentLanguage, setLanguageCookie, type Language } from "@/lib/i18n";

async function changeLanguage(formData: FormData) {
  "use server";

  const lang = (formData.get("lang") ?? "").toString() as Language;
  if (lang !== "en" && lang !== "pt") return;

  await setLanguageCookie(lang);
  revalidatePath("/", "layout");
}

export async function LanguageSwitcher() {
  const lang = await getCurrentLanguage();

  return (
    <form action={changeLanguage} className="flex items-center gap-1 text-[11px] text-zinc-500">
      <button
        type="submit"
        name="lang"
        value="en"
        className={`rounded-full px-2 py-1 ${
          lang === "en"
            ? "bg-zinc-800 text-zinc-100"
            : "hover:bg-zinc-900 hover:text-zinc-100"
        }`}
      >
        EN
      </button>
      <span className="text-zinc-600">/</span>
      <button
        type="submit"
        name="lang"
        value="pt"
        className={`rounded-full px-2 py-1 ${
          lang === "pt"
            ? "bg-zinc-800 text-zinc-100"
            : "hover:bg-zinc-900 hover:text-zinc-100"
        }`}
      >
        PT
      </button>
    </form>
  );
}

