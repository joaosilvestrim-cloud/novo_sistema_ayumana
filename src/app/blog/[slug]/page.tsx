import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { Markdown } from "@/components/ui/markdown";
import { getPostBySlug } from "@/lib/blog";

function fmt(iso: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Artigo não encontrado" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.published_at ?? undefined,
    author: { "@type": "Organization", name: post.author_name },
    publisher: { "@type": "Organization", name: "Ayumana" },
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-2xl px-4 py-14">
        <Link href="/blog" className="text-sm text-foreground-muted hover:text-brand-dark">
          ← Voltar para o blog
        </Link>
        <span className="mt-6 block text-xs font-medium uppercase tracking-wide text-teal-600">
          {post.category}
        </span>
        <h1 className="mt-2 text-3xl font-semibold text-heading md:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          {post.author_name} · {fmt(post.published_at)}
        </p>

        {post.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_url}
            alt={post.title}
            className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover"
          />
        )}

        <div className="mt-8">
          <Markdown>{post.content}</Markdown>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-heading">Precisa conversar com alguém?</p>
          <p className="mt-1 text-sm text-foreground-muted">
            Encontre psicólogos brasileiros verificados, no Brasil ou no exterior.
          </p>
          <Link
            href="/psicologos"
            className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Encontrar psicólogo
          </Link>
        </div>
      </article>
    </PageShell>
  );
}
