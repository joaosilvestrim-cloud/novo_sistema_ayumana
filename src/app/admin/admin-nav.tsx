"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  MessagesSquare,
  Users,
  CreditCard,
  Newspaper,
  Palette,
  Plug,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/verificacao", label: "Verificação", icon: ShieldCheck, badgeKey: "verificacao" },
  { href: "/admin/moderacao", label: "Moderação", icon: MessagesSquare, badgeKey: "moderacao" },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
  { href: "/admin/integracoes", label: "Integrações", icon: Plug },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/estudio", label: "Estúdio", icon: Palette },
] as const;

export function AdminNav({
  badges,
}: {
  badges?: Partial<Record<string, number>>;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:gap-0.5 md:p-3">
      {ITEMS.map((item) => {
        const exact = "exact" in item && item.exact;
        const active = exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const badge = "badgeKey" in item ? badges?.[item.badgeKey] : undefined;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
            )}
            <Icon
              className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "")}
            />
            <span className="flex-1">{item.label}</span>
            {badge ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1.5 text-xs font-semibold text-yellow-900">
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
