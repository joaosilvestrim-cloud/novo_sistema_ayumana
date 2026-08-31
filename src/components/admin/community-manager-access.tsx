"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Check, AlertCircle, Trash2, UserCog } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { createCommunityManagerAction, removeCommunityManagerAction } from "@/app/admin/comunidades/actions";

type Manager = { profileId: string; name: string | null; email: string | null };

export function CommunityManagerAccess({ communityId, managers }: { communityId: string; managers: Manager[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; text: string; password?: string } | null>(null);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("community_id", communityId);
    setSaving(true);
    setRes(null);
    try {
      const r = await createCommunityManagerAction(fd);
      if (r.ok) {
        setRes({
          ok: true,
          text: r.created
            ? `Acesso criado para ${r.email}.`
            : `${r.email} agora tem acesso a esta comunidade.`,
          password: r.password,
        });
        form.reset();
        router.refresh();
      } else {
        setRes({ ok: false, text: r.error || "Não foi possível dar acesso." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(profileId: string) {
    if (!window.confirm("Remover o acesso deste responsável?")) return;
    const fd = new FormData();
    fd.set("community_id", communityId);
    fd.set("profile_id", profileId);
    await removeCommunityManagerAction(fd);
    router.refresh();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background p-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg"><UserCog className="h-5 w-5 text-brand-dark" /> Acesso do responsável</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">
          Dá ao líder da comunidade um login só de leitura, para acompanhar os números dela (visitas, contatos no WhatsApp). Ele não edita a página.
        </p>
      </div>

      {managers.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {managers.map((m) => (
            <li key={m.profileId} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-heading">{m.name || "—"}</p>
                <p className="truncate text-xs text-foreground-muted">{m.email}</p>
              </div>
              <button type="button" onClick={() => remove(m.profileId)} className="shrink-0 text-foreground-muted hover:text-danger" aria-label="Remover acesso">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {res && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${res.ok ? "border-green-200 bg-green-50 text-green-800" : "border-danger/30 bg-danger/10 text-danger"}`}>
          <p className="flex items-center gap-1.5">{res.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {res.text}</p>
          {res.password && (
            <p className="mt-1 flex items-center gap-1.5 font-mono text-xs">
              <KeyRound className="h-3.5 w-3.5" /> Senha provisória: <strong>{res.password}</strong> (passe ao responsável; ele pode trocar em &quot;Esqueci minha senha&quot;).
            </p>
          )}
        </div>
      )}

      <form onSubmit={add} className="grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2">
        <Field label="Nome do responsável" htmlFor="manager_name">
          <Input id="manager_name" name="manager_name" />
        </Field>
        <Field label="E-mail" htmlFor="manager_email">
          <Input id="manager_email" name="manager_email" type="email" required />
        </Field>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Dando acesso…</> : <><KeyRound className="h-4 w-4" /> Dar acesso ao responsável</>}
          </button>
        </div>
      </form>
    </section>
  );
}
