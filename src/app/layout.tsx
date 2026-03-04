import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DueNotesBell } from "./_components/DueNotesBell";
import { NotificationsClient } from "./_components/NotificationsClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Knowledge Garden",
  description: "A small garden for your evolving notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
              <div className="flex items-center gap-6">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-50"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                    ✺
                  </span>
                  <span>Knowledge Garden</span>
                </Link>
                <nav className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                  <Link
                    href="/notes"
                    className="rounded-full px-3 py-1 hover:bg-zinc-900 hover:text-zinc-100"
                  >
                    Notes
                  </Link>
                  <Link
                    href="/garden"
                    className="rounded-full bg-emerald-500 px-3 py-1 text-zinc-950 hover:bg-emerald-400"
                  >
                    Daily Garden
                  </Link>
                </nav>
              </div>
              <DueNotesBell />
            </div>
          </header>
          <main className="flex-1 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-950">
            <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
          </main>
          <NotificationsClient />
        </div>
      </body>
    </html>
  );
}

