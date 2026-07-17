import Link from "next/link";
import { Search } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { listPosts, getCategories } from "@/lib/blog";

export const metadata = {
  title: "Blog",
  description:
    "Saúde mental em português, com foco em quem é brasileiro e vive longe de casa. Artigos sobre ansiedade, adaptação, saudade e mais.",
};

const CATEGORY_LABEL: Record<string, string> = {
  exterior: "Brasileiros no exterior",
  "saude-mental": "Saúde mental",
  familia: "Família",
  geral: "Geral",
};

const catLabel = (c: string) =>
  CATEGORY_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, " ");

function fmt(iso: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return "";
  }
}

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const category = one(sp.categoria).trim();

  const [posts, categories] = await Promise.all([
    listPosts(60, { q: q || undefined, category: category || undefined }),
    getCategories(),
  ]);

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
      active
        ? "border-brand bg-brand/10 font-medium text-brand-dark"
        : "border-border text-foreground-muted hover:border-brand hover:text-brand-dark"
    }`;

  const withParams = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("categoria", category);
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    const s = p.toString();
    return s ? `/blog?${s}` : "/blog";
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-14">
        <header className="mb-8">
          <h1 className="text-4xl font-semibold text-heading">Blog</h1>
          <p className="mt-2 text-foreground-muted">
            Saúde mental em português — com carinho especial para quem vive fora
            do Brasil.
          </p>
        </header>

        {/* Busca */}
        <form method="get" className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-background px-3">
          <Search className="h-4 w-4 text-foreground-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar artigos..."
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
          {category && <input type="hidden" name="categoria" value={category} />}
          <button className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
            Buscar
          </button>
        </form>

        {/* Categorias */}
        <div className="mb-10 flex flex-wrap gap-2">
          <Link href={withParams({ categoria: "" })} className={chip(!category)}>
            Todos
          </Link>
          {categories.map((c) => (
            <Link
              key={c.category}
              href={withParams({ categoria: c.category })}
              className={chip(category === c.category)}
            >
              {catLabel(c.category)}{" "}
              <span className="text-foreground-muted">({c.count})</span>
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background p-12 text-center text-foreground-muted">
            Nenhum artigo encontrado{q ? ` para "${q}"` : ""}.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-shadow hover:shadow-md"
              >
                {p.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.cover_url}
                    alt={p.title}
                    loading="lazy"
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-teal-100 to-green-100" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs font-medium uppercase tracking-wide text-teal-600">
                    {catLabel(p.category)}
                  </span>
                  <h2 className="mt-2 text-lg font-semibold text-heading group-hover:text-brand-dark">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-foreground-muted">
                      {p.excerpt}
                    </p>
                  )}
                  <p className="mt-4 text-xs text-foreground-muted">
                    {p.author_name} · {fmt(p.published_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
