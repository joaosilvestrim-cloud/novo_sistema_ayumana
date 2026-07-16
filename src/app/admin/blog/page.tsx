import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/lib/types";
import { deletePostAction } from "./actions";

export const metadata = { title: "Blog (admin)" };

export default async function AdminBlogPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  const posts = (data as BlogPost[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Blog</h1>
        <Link
          href="/admin/blog/novo"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> Novo artigo
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background p-12 text-center text-foreground-muted">
          Nenhum artigo ainda.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-background">
          {posts.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-heading">{p.title}</p>
                  {p.published ? (
                    <Badge tone="success">Publicado</Badge>
                  ) : (
                    <Badge tone="neutral">Rascunho</Badge>
                  )}
                </div>
                <p className="text-xs text-foreground-muted">/blog/{p.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/blog/${p.id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-surface-muted"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Link>
                <form action={deletePostAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-danger hover:bg-danger/10">
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
