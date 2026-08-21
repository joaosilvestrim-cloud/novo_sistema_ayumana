"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Search } from "lucide-react";

export type CompletudeRow = {
  profileId: string;
  name: string;
  email: string | null;
  percent: number;
  obrigatorio: string[];
  recomendado: string[];
};

export function CompletudeList({ rows }: { rows: CompletudeRow[] }) {
  const [q, setQ] = useState("");
  const [soObrigatorio, setSoObrigatorio] = useState(false);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (soObrigatorio && r.obrigatorio.length === 0) return false;
      if (!t) return true;
      return (r.name || "").toLowerCase().includes(t) || (r.email || "").toLowerCase().includes(t);
    });
  }, [q, rows, soObrigatorio]);

  return (
    <section className="rounded-2xl border border-border bg-background">
      <div className="border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg">Quem precisa completar ({filtrados.length})</h2>
            <p className="mt-0.5 text-sm text-foreground-muted">Do menos completo para o mais completo.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground-muted">
            <input type="checkbox" checked={soObrigatorio} onChange={(e) => setSoObrigatorio(e.target.checked)} className="h-4 w-4 accent-[var(--ayu-verde)]" />
            Só com obrigatório faltando
          </label>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-foreground-muted">Nenhum perfil encontrado.</div>
      ) : (
        <ul className="divide-y divide-border">
          {filtrados.map((r) => (
            <li key={r.profileId} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/usuarios/${r.profileId}`} className="font-medium text-heading hover:text-brand-dark hover:underline">{r.name}</Link>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.percent < 50 ? "bg-yellow-400/15 text-yellow-700" : "bg-brand/10 text-brand-dark"}`}>{r.percent}%</span>
                  </div>
                  {r.email && <p className="text-xs text-foreground-muted">{r.email}</p>}
                  {r.obrigatorio.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700"><AlertCircle className="h-3.5 w-3.5" /> Falta preencher (obrigatório):</span>
                      {r.obrigatorio.map((c) => (
                        <span key={c} className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-[11px] font-medium text-yellow-700">{c}</span>
                      ))}
                    </div>
                  )}
                  {r.recomendado.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <span className="text-xs text-foreground-muted">Falta (recomendado):</span>
                      {r.recomendado.map((c) => (
                        <span key={c} className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-foreground-muted">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Link href={`/admin/usuarios/${r.profileId}`} className="inline-flex h-8 shrink-0 items-center rounded-lg border border-border px-3 text-xs font-medium hover:bg-surface-muted">Gerenciar</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
