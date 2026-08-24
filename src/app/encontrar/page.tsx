import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/site/page-shell";
import { PatientQuiz } from "@/components/catalog/patient-quiz";
import { COUNTRIES } from "@/lib/types";
import type { Specialty } from "@/lib/types";

export const metadata = {
  title: "Encontrar meu psicólogo",
  description:
    "Responda 4 perguntas rápidas e a Ayumana mostra psicólogos brasileiros que combinam com você. Online, no Brasil ou no exterior.",
};

export default async function EncontrarPage() {
  const supabase = await createClient();
  const { data: specialties } = await supabase
    .from("specialties")
    .select("name,slug")
    .order("sort_order");

  const especialidades = ((specialties as Pick<Specialty, "name" | "slug">[]) ?? []).map((s) => ({
    name: s.name,
    slug: s.slug,
  }));

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-8 text-center">
          <h1 className="text-3xl">Vamos encontrar seu psicólogo</h1>
          <p className="mt-2 text-foreground-muted">
            Leva menos de um minuto. No fim, você vê profissionais que combinam com o que precisa.
          </p>
        </header>

        <PatientQuiz especialidades={especialidades} paises={[...COUNTRIES]} />
      </div>
    </PageShell>
  );
}
