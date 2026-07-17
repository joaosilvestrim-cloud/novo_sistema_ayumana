import Link from "next/link";
import { LogOut, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/logo";
import { signOutAction } from "@/app/(auth)/actions";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  // Badges de pendências para a navegação.
  const supabase = createAdminClient();
  const [verif, perg, resp] = await Promise.all([
    supabase.from("psychologists").select("*", { count: "exact", head: true }).eq("verification_status", "pendente"),
    supabase.from("forum_questions").select("*", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("forum_answers").select("*", { count: "exact", head: true }).eq("status", "pendente"),
  ]);
  const badges = {
    verificacao: verif.count ?? 0,
    moderacao: (perg.count ?? 0) + (resp.count ?? 0),
  };

  return (
    <div className="min-h-screen bg-surface md:grid md:grid-cols-[248px_1fr]">
      {/* Sidebar */}
      <aside className="flex flex-col bg-brand-dark text-white md:min-h-screen">
        <div className="flex items-center justify-between px-4 py-4">
          <Logo variant="symbol" href="/admin" />
          <span className="text-sm font-semibold">Admin Ayumana</span>
        </div>
        <div className="hidden md:block md:flex-1">
          <AdminNav badges={badges} />
        </div>
        {/* nav horizontal no mobile */}
        <div className="border-t border-white/10 md:hidden">
          <AdminNav badges={badges} />
        </div>
        <div className="hidden border-t border-white/10 p-3 md:block">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" /> Ver site
          </Link>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-end gap-3 border-b border-border bg-background px-4 md:px-8">
          <span className="hidden text-sm text-foreground-muted sm:inline">
            {admin.full_name || admin.email}
          </span>
          <form action={signOutAction}>
            <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-foreground-muted hover:bg-surface-muted">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
