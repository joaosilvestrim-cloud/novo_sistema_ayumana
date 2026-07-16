import { requireAdmin } from "@/lib/auth";
import { PostForm } from "../post-form";

export const metadata = { title: "Novo artigo" };

export default async function NovoPostPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Novo artigo</h1>
      <PostForm post={null} />
    </div>
  );
}
