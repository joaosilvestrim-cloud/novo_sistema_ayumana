import Link from "next/link";
import { LayoutDashboard, UserRound, CreditCard, MessagesSquare, LogOut, Palette } from "lucide-react";
import { requireUser, getProfile, getMyPsychologist } from "@/lib/auth";
import { effectivePlan } from "@/lib/plan-features";
import { Logo } from "@/components/ui/logo";
import { signOutAction } from "@/app/(auth)/actions";
import { SupportButton } from "@/components/painel/support-button";

const NAV = [
  { href: "/painel", label: "Início", icon: LayoutDashboard },
  { href: "/painel/onboarding", label: "Meu perfil", icon: UserRound },
  { href: "/painel/forum", label: "Fórum", icon: MessagesSquare },
  { href: "/painel/assinatura", label: "Assinatura", icon: CreditCard },
];

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  // "Meu conteúdo" só aparece para quem tem o Estúdio no plano.
  const psy = profile?.role === "psicologo" ? await getMyPsychologist() : null;
  const temEstudio =
    !!psy &&
    effectivePlan({
      plan_tier: psy.plan_tier,
      trial_tier: psy.trial_tier,
      trial_ends_at: psy.trial_ends_at,
    }) === "presenca";
  const nav = temEstudio
    ? [...NAV.slice(0, 2), { href: "/painel/conteudo", label: "Meu conteúdo", icon: Palette }, ...NAV.slice(2)]
    : NAV;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin/verificacao"
                className="text-sm font-medium text-teal-700 hover:underline"
              >
                Área admin
              </Link>
            )}
            <SupportButton />
            <span className="hidden text-sm text-foreground-muted sm:inline">
              {profile?.full_name || profile?.email}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-foreground-muted hover:bg-surface-muted"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-8 md:self-start">
          <nav className="flex gap-1 md:flex-col">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-background hover:text-brand-dark"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
