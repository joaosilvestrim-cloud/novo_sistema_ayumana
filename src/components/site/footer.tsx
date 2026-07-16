import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const COLS = [
  {
    title: "Plataforma",
    links: [
      { href: "/psicologos", label: "Encontrar psicólogo" },
      { href: "/perguntas", label: "Perguntas & respostas" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Para psicólogos",
    links: [
      { href: "/para-psicologos", label: "Planos" },
      { href: "/cadastro", label: "Criar perfil" },
      { href: "/login", label: "Entrar" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacidade", label: "Privacidade (LGPD)" },
      { href: "/termos", label: "Termos de uso" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo href={null} />
          <p className="max-w-xs text-sm text-foreground-muted">
            Terapia em português, onde você estiver. Psicólogos brasileiros
            verificados, no Brasil ou no exterior.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-sm font-semibold text-heading">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-foreground-muted transition-colors hover:text-brand-dark"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-foreground-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Ayumana. Todos os direitos reservados.</p>
          <p>Psicoterapia com alma brasileira.</p>
        </div>
      </div>
    </footer>
  );
}
