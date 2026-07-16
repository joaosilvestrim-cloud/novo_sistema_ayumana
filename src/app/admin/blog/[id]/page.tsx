import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BlogPost } from "@/lib/types";
import { PostForm } from "../post-form";

export const metadata = { title: "Editar artigo" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Editar artigo</h1>
      <PostForm post={data as BlogPost} />
    </div>
  );
}
