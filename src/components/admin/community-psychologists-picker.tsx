"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2, Check, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/field";
import { saveCommunityPsychologistsAction } from "@/app/admin/comunidades/actions";

type Psi = { id: string; name: string; crp: string | null };

export function CommunityPsychologistsPicker({ communityId, all, currentIds }: {
  communityId: string; all: Psi[]; currentIds: string[];
}) {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>(currentIds);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  const byId = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);
  const selecionados = sel.map((id) => byId.get(id)).filter(Boolean) as Psi[];

  const filtro = q.trim().toLowerCase();
  const resultados = filtro
    ? all.filter((p) => !sel.includes(p.id) && (p.name.toLowerCase().includes(filtro) || (p.crp ?? "").toLowerCase().includes(filtro))).slice(0, 12)
    : [];

  const add = (id: string) => { setSel((s) => [...s, id]); setOk(false); };
  const remove = (id: string) => { setSel((s) => s.filter((x) => x !== id)); setOk(false); };

  async function salvar() {
    setSaving(true);
    setOk(false);
    const fd = new FormData();
    fd.set("community_id", communityId);
    sel.forEach((id) => fd.append("psychologist_ids", id));
    try {
      const res = await saveCommunityPsychologistsAction(fd);
      if (res.ok) { setOk(true); router.refresh(); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background p-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-brand-dark" /> Psicólogos em destaque</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">
          Escolha profissionais a dedo para esta comunidade. Se não escolher nenhum, a landing mostra automaticamente quem atende no país e no exterior.
        </p>
      </div>

      {selecionados.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selecionados.map((p, i) => (
            <li key={p.id} className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5 text-sm text-brand-dark">
              <span className="font-medium">{i + 1}.</span> {p.name}
              <button type="button" onClick={() => remove(p.id)} className="text-brand-dark/70 hover:text-danger" aria-label="Remover"><X className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar psicólogo por nome ou CRP para adicionar" />
        {resultados.length > 0 && (
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
            {resultados.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="text-sm text-foreground">{p.name} {p.crp && <span className="text-xs text-foreground-muted">· {p.crp}</span>}</span>
                <button type="button" onClick={() => add(p.id)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-surface-muted"><Plus className="h-3.5 w-3.5" /> Adicionar</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={salvar} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : "Salvar curadoria"}
        </button>
        {ok && <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700"><Check className="h-4 w-4" /> Curadoria salva</span>}
      </div>
    </section>
  );
}
