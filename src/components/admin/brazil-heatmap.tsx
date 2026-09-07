// Mapa de calor do Brasil por estado (tile map). Cada estado é um bloco
// posicionado na grade conforme a geografia; a cor vai do claro (poucos) ao
// verde escuro (muitos). Server component, sem biblioteca externa.

type UF = { uf: string; nome: string; col: number; row: number };

// Posições numa grade 6 colunas x 9 linhas, aproximando o mapa do Brasil.
const ESTADOS: UF[] = [
  { uf: "RR", nome: "Roraima", col: 3, row: 1 },
  { uf: "AP", nome: "Amapá", col: 5, row: 1 },
  { uf: "AM", nome: "Amazonas", col: 2, row: 2 },
  { uf: "PA", nome: "Pará", col: 3, row: 2 },
  { uf: "MA", nome: "Maranhão", col: 4, row: 2 },
  { uf: "CE", nome: "Ceará", col: 5, row: 2 },
  { uf: "RN", nome: "Rio Grande do Norte", col: 6, row: 2 },
  { uf: "AC", nome: "Acre", col: 1, row: 3 },
  { uf: "RO", nome: "Rondônia", col: 2, row: 3 },
  { uf: "TO", nome: "Tocantins", col: 3, row: 3 },
  { uf: "PI", nome: "Piauí", col: 4, row: 3 },
  { uf: "PE", nome: "Pernambuco", col: 5, row: 3 },
  { uf: "PB", nome: "Paraíba", col: 6, row: 3 },
  { uf: "MT", nome: "Mato Grosso", col: 2, row: 4 },
  { uf: "GO", nome: "Goiás", col: 3, row: 4 },
  { uf: "BA", nome: "Bahia", col: 4, row: 4 },
  { uf: "AL", nome: "Alagoas", col: 5, row: 4 },
  { uf: "SE", nome: "Sergipe", col: 6, row: 4 },
  { uf: "MS", nome: "Mato Grosso do Sul", col: 2, row: 5 },
  { uf: "DF", nome: "Distrito Federal", col: 3, row: 5 },
  { uf: "MG", nome: "Minas Gerais", col: 4, row: 5 },
  { uf: "ES", nome: "Espírito Santo", col: 5, row: 5 },
  { uf: "SP", nome: "São Paulo", col: 3, row: 6 },
  { uf: "RJ", nome: "Rio de Janeiro", col: 4, row: 6 },
  { uf: "PR", nome: "Paraná", col: 3, row: 7 },
  { uf: "SC", nome: "Santa Catarina", col: 3, row: 8 },
  { uf: "RS", nome: "Rio Grande do Sul", col: 3, row: 9 },
];

// Interpola do verde bem claro ao verde escuro conforme a intensidade (0..1).
function corDaIntensidade(t: number): string {
  const clara = [234, 243, 224]; // #EAF3E0
  const escura = [30, 74, 20]; // #1E4A14
  const c = clara.map((a, i) => Math.round(a + (escura[i] - a) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function BrazilHeatmap({ counts }: { counts: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(counts));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const comDado = ESTADOS.filter((e) => (counts[e.uf] ?? 0) > 0).length;

  const ranking = [...ESTADOS]
    .map((e) => ({ ...e, n: counts[e.uf] ?? 0 }))
    .filter((e) => e.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      {/* Mapa */}
      <div>
        <div
          className="mx-auto grid w-full max-w-md gap-1.5"
          style={{ gridTemplateColumns: "repeat(6, 1fr)", gridTemplateRows: "repeat(9, 1fr)" }}
        >
          {ESTADOS.map((e) => {
            const n = counts[e.uf] ?? 0;
            const t = n === 0 ? 0 : 0.18 + 0.82 * (n / max);
            const bg = n === 0 ? "var(--surface-muted, #eef1f0)" : corDaIntensidade(t);
            const claro = t < 0.55;
            return (
              <div
                key={e.uf}
                title={`${e.nome} (${e.uf}): ${n} ${n === 1 ? "psicólogo" : "psicólogos"}`}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border border-black/5 transition-transform hover:scale-105"
                style={{ gridColumn: e.col, gridRow: e.row, background: bg }}
              >
                <span className={`text-[11px] font-bold leading-none ${claro ? "text-foreground" : "text-white"}`}>{e.uf}</span>
                <span className={`mt-0.5 text-[13px] font-semibold leading-none ${claro ? "text-heading" : "text-white"}`}>{n}</span>
              </div>
            );
          })}
        </div>

        {/* Legenda de cor */}
        <div className="mx-auto mt-4 flex max-w-md items-center gap-3">
          <span className="text-xs text-foreground-muted">0</span>
          <div className="h-2.5 flex-1 rounded-full" style={{ background: `linear-gradient(to right, ${corDaIntensidade(0.18)}, ${corDaIntensidade(1)})` }} />
          <span className="text-xs text-foreground-muted">{max}</span>
        </div>
        <p className="mx-auto mt-1 max-w-md text-center text-xs text-foreground-muted">
          Passe o mouse em cada estado para ver o número. {total} psicólogos em {comDado} estados.
        </p>
      </div>

      {/* Ranking ao lado */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-semibold text-heading">Onde estão</p>
        {ranking.length === 0 ? (
          <p className="mt-2 text-xs text-foreground-muted">Sem estado preenchido nos perfis ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {ranking.map((e) => (
              <li key={e.uf} className="flex items-center gap-2">
                <span className="w-7 shrink-0 text-xs font-bold text-brand-dark">{e.uf}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
                  <div className="h-full rounded-full bg-brand-dark" style={{ width: `${Math.round((e.n / max) * 100)}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-semibold text-foreground">{e.n}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
