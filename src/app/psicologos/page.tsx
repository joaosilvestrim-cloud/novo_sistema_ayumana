import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/site/page-shell";
import { CatalogFiltersForm } from "@/components/catalog/filters";
import { PsychologistCard } from "@/components/catalog/psychologist-card";
import {
  listPsychologists,
  type CatalogFilters,
} from "@/lib/psychologists";
import type {
  Approach,
  Audience,
  Gender,
  Specialty,
} from "@/lib/types";

export const metadata = {
  title: "Encontrar psicólogo",
  description:
    "Busque psicólogos brasileiros verificados por queixa, abordagem, público e fuso horário. Atendimento online, no Brasil e no exterior.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

function parseFilters(sp: SearchParams): CatalogFilters {
  const precoMax = str(sp.precoMax);
  return {
    q: str(sp.q),
    especialidade: str(sp.especialidade),
    abordagem: str(sp.abordagem),
    publico: str(sp.publico) as Audience | undefined,
    formato: str(sp.formato) as "online" | "presencial" | undefined,
    genero: str(sp.genero) as Gender | undefined,
    pais: str(sp.pais),
    exterior: str(sp.exterior) === "1",
    precoMax: precoMax ? Number(precoMax.replace(/\D/g, "")) || undefined : undefined,
    page: Number(str(sp.page)) || 1,
  };
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);

  const supabase = await createClient();
  const [{ data: specialties }, { data: approaches }] = await Promise.all([
    supabase.from("specialties").select("*").order("sort_order"),
    supabase.from("approaches").select("*").order("sort_order"),
  ]);

  const { rows, total, page, pageSize } = await listPsychologists(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      const val = Array.isArray(v) ? v[0] : v;
      if (val && k !== "page") params.set(k, val);
    });
    params.set("page", String(p));
    return `/psicologos?${params.toString()}`;
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl">Encontre seu psicólogo</h1>
          <p className="mt-2 text-foreground-muted">
            Profissionais brasileiros com CRP verificado. Atendimento em
            português, no Brasil ou onde você estiver.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
            <CatalogFiltersForm
              specialties={(specialties as Specialty[]) ?? []}
              approaches={(approaches as Approach[]) ?? []}
              current={filters}
            />
          </aside>

          <section className="min-w-0">
            <p className="mb-4 text-sm text-foreground-muted">
              {total} profissional(is) encontrado(s)
            </p>

            {rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background p-12 text-center">
                <p className="text-heading">Nenhum profissional encontrado.</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  Tente remover alguns filtros. O catálogo está crescendo — novos
                  perfis entram a cada semana.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {rows.map((p) => (
                  <PsychologistCard key={p.id} p={p} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={qs(n)}
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm ${
                      n === page
                        ? "border-brand bg-brand/10 font-medium text-brand-dark"
                        : "border-border text-foreground-muted hover:bg-surface-muted"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
              </nav>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
