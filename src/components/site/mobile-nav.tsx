"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";

type Item = { href: string; label: string };

export function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // O menu é renderizado via portal no body. Sem isso, o backdrop-blur do
  // <header> vira o "containing block" do position:fixed e o overlay fica preso
  // dentro do header (só a altura dele), fazendo os links vazarem sobre a página.
  useEffect(() => setMounted(true), []);

  // Trava o scroll do corpo quando o menu está aberto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const menu = (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="absolute right-0 top-0 flex h-full w-80 max-w-[86%] flex-col bg-background p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <Logo className="h-9" />
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-heading hover:bg-surface-muted"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-heading hover:bg-surface-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-border px-3 py-3 text-center text-base font-medium text-heading hover:bg-surface-muted"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-brand px-3 py-3 text-center text-base font-medium text-white hover:bg-brand-dark"
          >
            Sou psicólogo
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-heading hover:bg-surface-muted"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && mounted && createPortal(menu, document.body)}
    </div>
  );
}
