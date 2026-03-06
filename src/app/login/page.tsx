import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  clearSessionCookie,
} from "@/lib/auth";
import { getCurrentLanguage } from "@/lib/i18n";

async function login(formData: FormData) {
  "use server";

  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const password = (formData.get("password") ?? "").toString();
  const remember = (formData.get("remember") ?? "").toString() === "on";

  // Lightweight rate-limit guard: rely on API endpoint
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/auth/rate-limit`, {
      method: "POST",
      headers: {
        "x-forwarded-for": (formData.get("clientIp") ?? "").toString(),
      },
    });
    if (!res.ok) {
      redirect("/login?error=rate");
    }
  } catch {
    // If rate-limit check fails, just continue; better to allow login than block
  }

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    redirect("/login?error=invalid");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    redirect("/login?error=invalid");
  }

  await createSession(user.id, remember);
  redirect("/");
}

async function signup(formData: FormData) {
  "use server";

  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const password = (formData.get("password") ?? "").toString();
  const remember = (formData.get("remember") ?? "").toString() === "on";

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  // Basic password rules: length >= 8, at least one letter and one number
  const tooShort = password.length < 8;
  const lacksLetter = !/[a-zA-Z]/.test(password);
  const lacksNumber = !/[0-9]/.test(password);
  if (tooShort || lacksLetter || lacksNumber) {
    redirect("/login?error=weak");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing && existing.passwordHash) {
    redirect("/login?error=exists");
  }

  const passwordHash = await hashPassword(password);

  const user =
    existing && !existing.passwordHash
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash },
        })
      : await prisma.user.create({
          data: {
            email,
            passwordHash,
          },
        });

  await createSession(user.id, remember);
  redirect("/");
}

async function logout() {
  "use server";
  await clearSessionCookie();
  redirect("/login");
}

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;
  const lang = await getCurrentLanguage();

  const t =
    lang === "pt"
      ? {
          title: "Entrar na sua garden",
          subtitle:
            "Faça login ou crie uma conta simples com e-mail e senha.",
          emailLabel: "E-mail",
          passwordLabel: "Senha",
          login: "Entrar",
          signup: "Criar nova conta",
          logout: "Sair (limpar sessão atual)",
          missing: "Preencha e-mail e senha.",
          invalid: "E-mail ou senha inválidos.",
          exists: "Já existe um usuário com esse e-mail.",
          weakPassword:
            "A senha deve ter pelo menos 8 caracteres, com letras e números.",
          rememberMe: "Lembrar deste dispositivo",
        }
      : {
          title: "Sign in to your garden",
          subtitle: "Log in or create an account with email and password.",
          emailLabel: "Email",
          passwordLabel: "Password",
          login: "Log in",
          signup: "Create new account",
          logout: "Log out (clear current session)",
          missing: "Please fill email and password.",
          invalid: "Invalid email or password.",
          exists: "A user with this email already exists.",
          weakPassword:
            "Password must be at least 8 characters and include letters and numbers.",
          rememberMe: "Remember this device",
        };

  let errorMessage: string | null = null;
  if (error === "missing") {
    errorMessage = t.missing;
  } else if (error === "invalid") {
    errorMessage = t.invalid;
  } else if (error === "exists") {
    errorMessage = t.exists;
  } else if (error === "weak") {
    errorMessage = t.weakPassword;
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {t.subtitle}
        </p>
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/60 px-3 py-2 text-xs text-red-200">
          {errorMessage}
        </p>
      )}

      <form
        action={login}
        className="space-y-4 rounded-2xl border border-zinc-900 bg-zinc-950/70 p-4"
      >
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            {t.emailLabel}
          </label>
          <input
            name="email"
            type="email"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="voce@example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            {t.passwordLabel}
          </label>
          <input
            name="password"
            type="password"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-[11px] text-zinc-500">
            <input
              type="checkbox"
              name="remember"
              className="h-3 w-3 rounded border-zinc-700 bg-zinc-950 text-emerald-500"
            />
            <span>{t.rememberMe}</span>
          </label>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-emerald-400"
          >
            {t.login}
          </button>
          <button
            type="submit"
            formAction={signup}
            className="inline-flex w-full items-center justify-center rounded-full border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-900"
          >
            {t.signup}
          </button>
        </div>
      </form>

      <form action={logout}>
        <button
          type="submit"
          className="text-[11px] text-zinc-500 hover:text-zinc-300"
        >
          {t.logout}
        </button>
      </form>
    </div>
  );
}

