"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { yearlyCents, formatCents } from "@/lib/pricing";
import { updatePlanPriceAction } from "@/app/admin/assinaturas/price-actions";

type PlanRow = { id: string; name: string; price_cents: number };

export function PlanPriceEditor({ plans }: { plans: PlanRow[] }) {
  return (
    <section className="rounded-2xl border border-border bg-background p-6">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-brand-dark" />
        <h2 className="text-lg">Preços dos planos</h2>
      </div>
      <p className="mt-1 text-sm text-foreground-muted">
        Vale para novas assinaturas. Quem já paga continua no valor que contratou.
        O plano anual aplica 25% de desconto automático sobre os 12 meses.
      </p>
      <div className="mt-4 space-y-3">
        {plans.map((p) => (
          <Row key={p.id} plan={p} />
        ))}
      </div>
    </section>
  );
}

function Row({ plan }: { plan: PlanRow }) {
  const router = useRouter();
  const [reais, setReais] = useState((plan.price_cents / 100).toFixed(2).replace(".", ","));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const valor = Number(reais.replace(/\./g, "").replace(",", "."));
  const cents = Number.isFinite(valor) ? Math.round(valor * 100) : 0;
  const anual = yearlyCents(cents);
  const mudou = cents !== plan.price_cents;

  function salvar() {
    setMsg(null);
    start(async () => {
      const r = await updatePlanPriceAction(plan.id, valor);
      setMsg({ ok: r.ok, text: r.msg });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[140px] flex-1">
          <p className="font-medium text-heading">{plan.name}</p>
          <p className="text-xs text-foreground-muted">
            Anual: {formatCents(anual)} no ano ({formatCents(Math.round(anual / 12))}/mês equivalente)
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-foreground-muted">R$</span>
          <input
            value={reais}
            onChange={(e) => setReais(e.target.value)}
            inputMode="decimal"
            className="h-9 w-28 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand"
          />
          <span className="text-sm text-foreground-muted">/mês</span>
        </div>
        <button
          onClick={salvar}
          disabled={pending || !mudou}
          className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
      {msg && (
        <p className={`mt-2 text-xs ${msg.ok ? "text-brand-dark" : "text-danger"}`}>{msg.text}</p>
      )}
    </div>
  );
}
