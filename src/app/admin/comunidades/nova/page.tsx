import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { CommunityForm } from "@/components/admin/community-form";

export const metadata = { title: "Nova comunidade" };

export default async function NovaComunidadePage() {
  await requireAdmin();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";
  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/comunidades" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-heading">
          <ArrowLeft className="h-4 w-4" /> Comunidades
        </Link>
        <h1 className="mt-2 text-2xl">Nova comunidade</h1>
      </div>
      <CommunityForm c={null} site={site} />
    </div>
  );
}
