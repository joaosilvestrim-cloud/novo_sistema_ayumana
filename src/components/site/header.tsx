import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/psicologos", label: "Encontrar psicólogo" },
  { href: "/perguntas", label: "Perguntas" },
  { href: "/blog", label: "Blog" },
  { href: "/para-psicologos", label: "Para psicólogos" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo priority className="h-16" />

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground-muted transition-colors hover:text-brand-dark"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Entrar
          </Button>
          <Button href="/cadastro" variant="primary" size="sm">
            Sou psicólogo
          </Button>
        </div>
      </div>
    </header>
  );
}
