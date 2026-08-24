"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react";

type Opt = { value: string; label: string };
type Especialidade = { slug: string; name: string };
type Pais = { code: string; name: string };

export function PatientQuiz({
  especialidades,
  paises,
}: {
  especialidades: Especialidade[];
  paises: Pais[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Record<string, string>>({
    publico: "", especialidade: "", formato: "", exterior: "0", pais: "", precoMax: "", genero: "",
  });

  const set = (k: string, v: string) => setAns((a) => ({ ...a, [k]: v }));

  // Passos. O país só aparece se a pessoa mora fora.
  const passos = useMemo(() => {
    const base: { key: string; titulo: string; sub?: string; opcoes: Opt[] }[] = [
      {
        key: "publico",
        titulo: "Para quem é a terapia?",
        sub: "Ajuda a mostrar quem atende esse público.",
        opcoes: [
          { value: "adulto", label: "Para mim (adulto)" },
          { value: "casal", label: "Para o casal" },
          { value: "adolescente", label: "Para um adolescente" },
          { value: "crianca", label: "Para uma criança" },
          { value: "idoso", label: "Para um idoso" },
          { value: "", label: "Prefiro ver todos" },
        ],
      },
      {
        key: "especialidade",
        titulo: "O que você quer trabalhar?",
        sub: "Escolha o tema principal. Dá para mudar depois.",
        opcoes: [{ value: "", label: "Ainda não sei / ver todos" }, ...especialidades.map((e) => ({ value: e.slug, label: e.name }))],
      },
      {
        key: "formato",
        titulo: "Como prefere ser atendido?",
        opcoes: [
          { value: "online", label: "Online" },
          { value: "presencial", label: "Presencial" },
          { value: "", label: "Tanto faz" },
        ],
      },
      {
        key: "exterior",
        titulo: "Você mora fora do Brasil?",
        sub: "Temos psicólogos que atendem brasileiros no exterior, no seu fuso.",
        opcoes: [
          { value: "0", label: "Moro no Brasil" },
          { value: "1", label: "Moro no exterior" },
        ],
      },
    ];
    if (ans.exterior === "1") {
      base.push({
        key: "pais",
        titulo: "Em qual país você está?",
        opcoes: [{ value: "", label: "Qualquer país" }, ...paises.map((p) => ({ value: p.code, label: p.name }))],
      });
    }
    base.push({
      key: "precoMax",
      titulo: "Tem uma faixa de valor por sessão?",
      sub: "Opcional. Só filtra quem informa o valor no perfil.",
      opcoes: [
        { value: "", label: "Tanto faz" },
        { value: "100", label: "Até R$ 100" },
        { value: "150", label: "Até R$ 150" },
        { value: "200", label: "Até R$ 200" },
        { value: "300", label: "Até R$ 300" },
      ],
    });
    base.push({
      key: "genero",
      titulo: "Preferência de gênero do profissional?",
      opcoes: [
        { value: "", label: "Indiferente" },
        { value: "feminino", label: "Mulher" },
        { value: "masculino", label: "Homem" },
      ],
    });
    return base;
  }, [ans.exterior, especialidades, paises]);

  const atual = passos[Math.min(step, passos.length - 1)];
  const ultimo = step >= passos.length - 1;
  const progresso = Math.round(((step + 1) / passos.length) * 100);

  function escolher(v: string) {
    set(atual.key, v);
    // Avança sozinho, a não ser que seja o último passo.
    if (!ultimo) setTimeout(() => setStep((s) => s + 1), 120);
  }

  function finalizar() {
    const p = new URLSearchParams();
    if (ans.publico) p.set("publico", ans.publico);
    if (ans.especialidade) p.set("especialidade", ans.especialidade);
    if (ans.formato) p.set("formato", ans.formato);
    if (ans.precoMax) p.set("precoMax", ans.precoMax);
    if (ans.genero) p.set("genero", ans.genero);
    if (ans.exterior === "1") {
      p.set("exterior", "1");
      if (ans.pais) p.set("pais", ans.pais);
    }
    router.push(`/psicologos?${p.toString()}`);
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-dark">
          <Sparkles className="h-4 w-4" /> Encontrar meu psicólogo
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progresso}%` }} />
        </div>

        <h2 className="mt-6 text-2xl font-semibold text-heading">{atual.titulo}</h2>
        {atual.sub && <p className="mt-1 text-sm text-foreground-muted">{atual.sub}</p>}

        <div className={`mt-5 grid gap-2 ${atual.opcoes.length > 6 ? "max-h-72 overflow-y-auto pr-1" : ""}`}>
          {atual.opcoes.map((o) => {
            const sel = ans[atual.key] === o.value;
            return (
              <button
                key={o.value || "vazio"}
                type="button"
                onClick={() => escolher(o.value)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  sel ? "border-brand bg-brand/10 font-medium text-brand-dark" : "border-border hover:bg-surface-muted"
                }`}
              >
                {o.label}
                {sel && <Check className="h-4 w-4 text-brand-dark" />}
              </button>
            );
          })}
        </div>

        {ultimo && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Quanto mais específico, mais afinado o resultado. Se a combinação ficar muito restrita, pode não aparecer nenhum psicólogo. Nesse caso é só voltar e afrouxar um filtro, ou escolher &quot;ver todos&quot;.
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-heading disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          {ultimo ? (
            <button
              type="button"
              onClick={finalizar}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Ver profissionais <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-medium hover:bg-surface-muted"
            >
              Pular <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-foreground-muted">
        O contato é direto com o psicólogo pelo WhatsApp. A Ayumana não cobra comissão.
      </p>
    </div>
  );
}
