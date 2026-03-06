import { cookies } from "next/headers";

export type Language = "en" | "pt";

const LANG_COOKIE = "kg_lang";

export async function getCurrentLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LANG_COOKIE)?.value;
  if (raw === "pt" || raw === "en") return raw;
  return "en";
}

export async function setLanguageCookie(lang: Language) {
  const cookieStore = await cookies();
  cookieStore.set(LANG_COOKIE, lang, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

