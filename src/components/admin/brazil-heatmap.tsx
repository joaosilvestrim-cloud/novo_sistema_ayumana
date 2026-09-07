// Mapa de calor do Brasil por estado, com o desenho geográfico real (SVG
// projetado do GeoJSON do IBGE). A cor de cada estado vai do claro (poucos)
// ao verde escuro (muitos). Server component, sem biblioteca externa.
import { BRAZIL_VIEWBOX, BRAZIL_PATHS } from "./brazil-geo";

const NOME_UF: Record<string, string> = Object.fromEntries(BRAZIL_PATHS.map((s) => [s.uf, s.name]));

// Interpola do verde bem claro ao verde escuro conforme a intensidade (0..1).
function corDaIntensidade(t: number): string {
  const clara = [234, 243, 224]; // #EAF3E0
  const escura = [26, 74, 18]; // #1A4A12
  const c = clara.map((a, i) => Math.round(a + (escura[i] - a) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function BrazilHeatmap({ counts, semLocal }: { counts: Record<string, number>; semLocal?: number }) {
  const max = Math.max(1, ...Object.values(counts));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const comDado = Object.values(counts).filter((n) => n > 0).length;

  const ranking = Object.entries(counts)
    .map(([uf, n]) => ({ uf, nome: NOME_UF[uf] ?? uf, n }))
    .filter((e) => e.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* Mapa geográfico real */}
      <div>
        <svg viewBox={BRAZIL_VIEWBOX} className="mx-auto block w-full max-w-xl" role="img" aria-label="Mapa de psicólogos por estado">
          {BRAZIL_PATHS.map((s) => {
            const n = counts[s.uf] ?? 0;
            const t = n === 0 ? 0 : 0.16 + 0.84 * (n / max);
            const fill = n === 0 ? "#eef1f0" : corDaIntensidade(t);
            return (
              <path key={s.uf} d={s.d} fill={fill} stroke="#ffffff" strokeWidth={1} strokeLinejoin="round" className="transition-opacity hover:opacity-80">
                <title>{`${s.name} (${s.uf}): ${n} ${n === 1 ? "psicólogo" : "psicólogos"}`}</title>
              </path>
            );
          })}
        </svg>

        {/* Legenda de cor */}
        <div className="mx-auto mt-3 flex max-w-md items-center gap-3">
          <span className="text-xs text-foreground-muted">0</span>
          <div className="h-2.5 flex-1 rounded-full" style={{ background: `linear-gradient(to right, ${corDaIntensidade(0.16)}, ${corDaIntensidade(1)})` }} />
          <span className="text-xs text-foreground-muted">{max}</span>
        </div>
        <p className="mx-auto mt-1 max-w-md text-center text-xs text-foreground-muted">
          Passe o mouse em cada estado para ver o número. {total} psicólogos localizados em {comDado} estados.
          {semLocal ? ` ${semLocal} sem cidade/estado informado.` : ""}
        </p>
      </div>

      {/* Ranking ao lado */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-semibold text-heading">Onde estão</p>
        {ranking.length === 0 ? (
          <p className="mt-2 text-xs text-foreground-muted">Sem localização preenchida nos perfis ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {ranking.map((e) => (
              <li key={e.uf} className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-xs font-bold text-brand-dark" title={e.nome}>{e.uf}</span>
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
