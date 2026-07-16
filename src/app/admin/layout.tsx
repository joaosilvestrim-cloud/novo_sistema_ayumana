import Link from "next/link";
import { ShieldCheck, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";
import { signOutAction } from "@/app/(auth)/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-border bg-brand-dark text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo variant="symbol" href="/admin/verificacao" />
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              <ShieldCheck className="h-4 w-4" /> Admin Ayumana
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/painel" className="text-white/70 hover:text-white">
              Ver painel
            </Link>
            <span className="hidden text-white/60 sm:inline">
              {admin.full_name || admin.email}
            </span>
            <form action={signOutAction}>
              <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-white/80 hover:bg-white/10">
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <nav className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl gap-1 px-4">
          {[
            { href: "/admin/verificacao", label: "Verificação" },
            { href: "/admin/moderacao", label: "Moderação" },
            { href: "/admin/blog", label: "Blog" },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-foreground-muted hover:border-brand hover:text-brand-dark"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
