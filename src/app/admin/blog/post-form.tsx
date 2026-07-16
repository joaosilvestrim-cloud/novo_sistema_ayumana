"use client";

import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { BlogPost } from "@/lib/types";
import { savePostAction, type BlogFormState } from "./actions";

const initial: BlogFormState = { error: null };

export function PostForm({ post }: { post: BlogPost | null }) {
  const [state, action] = useActionState(savePostAction, initial);

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

      <Field label="Conteúdo (Markdown)" htmlFor="content">
        <Textarea id="content" name="content" rows={16} defaultValue={post?.content ?? ""} className="font-mono text-xs" required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Autor" htmlFor="author_name">
          <Input id="author_name" name="author_name" defaultValue={post?.author_name ?? "Equipe Ayumana"} />
        </Field>
        <Field label="URL da capa (opcional)" htmlFor="cover_url">
          <Input id="cover_url" name="cover_url" defaultValue={post?.cover_url ?? ""} />
        </Field>
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
