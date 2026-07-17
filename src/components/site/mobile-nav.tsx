"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type Item = { href: string; label: string };

export function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);

  // Trava o scroll do corpo quando o menu está aberto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-background p-5 shadow-xl">
            <div className="flex justify-end">
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-heading hover:bg-surface-muted"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="mt-4 flex flex-col gap-1">
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
                className="rounded-lg px-3 py-3 text-center text-base font-medium text-heading hover:bg-surface-muted"
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
      )}
    </div>
  );
}
