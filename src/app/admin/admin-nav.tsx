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
  Ticket,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badgeKey?: string;
};

// Menu categorizado. O primeiro grupo (sem título) é a visão geral; os demais
// agrupam por área: comunidade, receita, conteúdo e sistema.
const GROUPS: { title?: string; items: Item[] }[] = [
  {
    items: [{ href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Comunidade",
    items: [
      { href: "/admin/usuarios", label: "Usuários", icon: Users },
      { href: "/admin/verificacao", label: "Verificação de CRP", icon: ShieldCheck, badgeKey: "verificacao" },
      { href: "/admin/moderacao", label: "Moderação", icon: MessagesSquare, badgeKey: "moderacao" },
    ],
  },
  {
    title: "Receita",
    items: [
      { href: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
      { href: "/admin/cupons", label: "Cupons", icon: Ticket },
      { href: "/admin/presenca", label: "Fila Presença", icon: Sparkles, badgeKey: "presenca" },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
      { href: "/estudio", label: "Estúdio", icon: Palette },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
      { href: "/admin/integracoes", label: "Integrações", icon: Plug },
    ],
  },
];

export function AdminNav({ badges }: { badges?: Partial<Record<string, number>> }) {
  const pathname = usePathname();

  const renderItem = (item: Item) => {
    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    const badge = item.badgeKey ? badges?.[item.badgeKey] : undefined;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "group relative flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />}
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "")} />
        <span className="flex-1">{item.label}</span>
        {badge ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1.5 text-xs font-semibold text-yellow-900">
            {badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:gap-0.5 md:p-3">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="contents md:block">
          {group.title && (
            <p className="hidden px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-white/40 md:block">
              {group.title}
            </p>
          )}
          {group.items.map(renderItem)}
        </div>
      ))}
    </nav>
  );
}
