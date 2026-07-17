"use client";

import { useActionState, useState } from "react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { RichEditor } from "@/components/ui/rich-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import type { BlogPost } from "@/lib/types";
import { savePostAction, type BlogFormState } from "./actions";

const initial: BlogFormState = { error: null };

export function PostForm({ post }: { post: BlogPost | null }) {
  const [state, action] = useActionState(savePostAction, initial);
  const [coverUrl] = useState(post?.cover_url ?? "");

  return (
    <form action={action} className="space-y-4">
      {post && <input type="hidden" name="id" value={post.id} />}

      <Field label="Título" htmlFor="title">
        <Input id="title" name="title" defaultValue={post?.title ?? ""} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug (URL)" htmlFor="slug" hint="Deixe vazio para gerar do título.">
          <Input id="slug" name="slug" defaultValue={post?.slug ?? ""} />
        </Field>
        <Field label="Categoria" htmlFor="category">
          <Input id="category" name="category" defaultValue={post?.category ?? "geral"} />
        </Field>
      </div>

      <Field label="Resumo" htmlFor="excerpt" hint="Aparece na listagem e nas meta tags.">
        <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-heading">Conteúdo</span>
        <RichEditor name="content" initialHtml={post?.content ?? ""} />
      </div>

      <Field label="Autor" htmlFor="author_name">
        <Input id="author_name" name="author_name" defaultValue={post?.author_name ?? "Equipe Ayumana"} />
      </Field>

      {/* Capa */}
      <div className="rounded-lg border border-border bg-background p-4">
        <span className="mb-2 block text-sm font-medium text-heading">Imagem de capa</span>
        <div className="flex flex-wrap items-center gap-4">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="Capa atual" className="h-20 w-32 rounded-md object-cover" />
          ) : (
            <div className="flex h-20 w-32 items-center justify-center rounded-md bg-surface-muted text-xs text-foreground-muted">
              sem capa
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              name="cover_file"
              accept="image/*"
              className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:text-heading"
            />
            <p className="mt-1 text-xs text-foreground-muted">
              Envie uma imagem (JPG, PNG ou WebP). Ela substitui a capa atual.
            </p>
          </div>
        </div>
        <input type="hidden" name="cover_url" value={coverUrl} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={post?.published ?? false} className="h-4 w-4 accent-[var(--ayu-verde)]" />
        Publicar (visível no site)
      </label>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <SubmitButton>Salvar</SubmitButton>
    </form>
  );
}
