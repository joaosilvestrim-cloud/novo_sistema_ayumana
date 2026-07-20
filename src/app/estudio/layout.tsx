import Link from "next/link";
import { Palette, LayoutGrid } from "lucide-react";
import { requireContentStaff } from "@/lib/auth";
import { signOutAction } from "@/app/(auth)/actions";

export const metadata = { title: "Estúdio de conteúdo" };

export default async function EstudioLayout({ children }: { children: React.ReactNode }) {
  const me = await requireContentStaff();
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-border bg-brand-dark text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/estudio" className="inline-flex items-center gap-2 font-semibold">
            <Palette className="h-5 w-5 text-[var(--ayu-amarelo)]" /> Estúdio Ayumana
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/estudio" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white">
              <LayoutGrid className="h-4 w-4" /> Clientes
            </Link>
            <span className="hidden text-white/50 sm:inline">{me.full_name || me.email}</span>
            <form action={signOutAction}>
              <button className="text-white/80 hover:text-white">Sair</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
