"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, Trash2, Check, AlertCircle } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import type { CommunityEvent } from "@/lib/communities-types";
import { saveEventAction, deleteEventAction } from "@/app/admin/comunidades/actions";

const STATUS = [
  { v: "proximo", label: "Próximo" },
  { v: "realizado", label: "Realizado" },
  { v: "cancelado", label: "Cancelado" },
];

export function CommunityEventsManager({ communityId, eventos }: { communityId: string; eventos: CommunityEvent[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function addEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("community_id", communityId);
    setSaving(true);
    setMsg(null);
    try {
      const res = await saveEventAction(fd);
      if (res.ok) {
        setMsg({ ok: true, text: "Evento adicionado." });
        form.reset();
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error || "Não foi possível salvar." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este evento?")) return;
    const fd = new FormData();
    fd.set("id", id);
    await deleteEventAction(fd);
    router.refresh();
  }

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "sem data");

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background p-5">
      <h2 className="flex items-center gap-2 text-lg"><CalendarPlus className="h-5 w-5 text-brand-dark" /> Eventos e encontros</h2>

      {eventos.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {eventos.map((ev) => (
            <li key={ev.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-heading">{ev.title}</p>
                <p className="text-xs text-foreground-muted">{fmt(ev.starts_at)}{ev.theme ? ` · ${ev.theme}` : ""} · {ev.status}</p>
              </div>
              <button type="button" onClick={() => remove(ev.id)} className="shrink-0 text-foreground-muted hover:text-danger" aria-label="Excluir evento">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {msg && (
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-800" : "border-danger/30 bg-danger/10 text-danger"}`}>
          {msg.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {msg.text}
        </div>
      )}

      <form onSubmit={addEvent} className="grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2">
        <Field label="Título do evento" htmlFor="title">
          <Input id="title" name="title" required placeholder="A parte emocional de recomeçar no Canadá" />
        </Field>
        <Field label="Tema" htmlFor="theme">
          <Input id="theme" name="theme" placeholder="Adaptação e pertencimento" />
        </Field>
        <Field label="Data e horário" htmlFor="starts_at">
          <Input id="starts_at" name="starts_at" type="datetime-local" />
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue="proximo">
            {STATUS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </Select>
        </Field>
        <Field label="Psicólogo(s) participante(s)" htmlFor="speaker">
          <Input id="speaker" name="speaker" placeholder="Nome do profissional" />
        </Field>
        <Field label="Link de inscrição" htmlFor="signup_url">
          <Input id="signup_url" name="signup_url" placeholder="https://..." />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Descrição" htmlFor="description">
            <textarea id="description" name="description" className="min-h-20 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : <><CalendarPlus className="h-4 w-4" /> Adicionar evento</>}
          </button>
        </div>
      </form>
    </section>
  );
}
