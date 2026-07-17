import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { listPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog",
  description:
    "Saúde mental em português, com foco em quem é brasileiro e vive longe de casa. Artigos sobre ansiedade, adaptação, saudade e mais.",
};

function fmt(iso: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default async function BlogPage() {
  const posts = await listPosts();

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-14">
        <header className="mb-10">
          <h1 className="text-4xl font-semibold text-heading">Blog</h1>
          <p className="mt-2 text-foreground-muted">
            Saúde mental em português — com carinho especial para quem vive fora
            do Brasil.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background p-12 text-center text-foreground-muted">
            Ainda não há artigos publicados. Em breve!
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
                    {p.category}
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
