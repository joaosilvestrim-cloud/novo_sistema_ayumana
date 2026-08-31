import Link from "next/link";
import { redirect } from "next/navigation";
import { Users2, Globe2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COUNTRIES } from "@/lib/types";

export const metadata = { title: "Minhas comunidades" };
const paisNome = (code: string) => COUNTRIES.find((p) => p.code === code)?.name ?? code;

type Row = { community: { id: string; name: string; slug: string; country_code: string; city_region: string | null; is_public: boolean } | null };

export default async function ParceiroHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data } = await admin
    .from("community_managers")
    .select("community:communities(id, name, slug, country_code, city_region, is_public)")
    .eq("profile_id", user.id);
  const comunidades = ((data as Row[] | null) ?? []).map((r) => r.community).filter(Boolean) as NonNullable<Row["community"]>[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Suas comunidades</h1>
        <p className="mt-1 text-foreground-muted">Acompanhe quantas pessoas chegaram pela sua comunidade e falaram com um psicólogo.</p>
      </div>

      {comunidades.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background p-12 text-center text-foreground-muted">
          Ainda não há uma comunidade ligada ao seu acesso. Fale com a equipe da Ayumana.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {comunidades.map((c) => (
            <Link key={c.id} href={`/parceiro/${c.slug}`} className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-brand hover:bg-brand/5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold text-heading group-hover:text-brand-dark"><Users2 className="h-5 w-5" /> {c.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-foreground-muted"><Globe2 className="h-3.5 w-3.5" /> {paisNome(c.country_code)}{c.city_region ? ` · ${c.city_region}` : ""}{!c.is_public ? " · rascunho" : ""}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-foreground-muted group-hover:text-brand-dark" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
