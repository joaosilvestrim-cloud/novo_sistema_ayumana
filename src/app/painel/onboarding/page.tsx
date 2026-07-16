import { getMyPsychologist } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Approach, Specialty } from "@/lib/types";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Meu perfil" };

export default async function OnboardingPage() {
  const psy = await getMyPsychologist();
  const supabase = await createClient();

  const [{ data: approaches }, { data: specialties }] = await Promise.all([
    supabase.from("approaches").select("*").order("sort_order"),
    supabase.from("specialties").select("*").order("sort_order"),
  ]);

  let selectedApproaches: number[] = [];
  let selectedSpecialties: number[] = [];
  let selectedCountries: string[] = [];

  if (psy) {
    const [{ data: a }, { data: s }, { data: c }] = await Promise.all([
      supabase.from("psychologist_approaches").select("approach_id").eq("psychologist_id", psy.id),
      supabase.from("psychologist_specialties").select("specialty_id").eq("psychologist_id", psy.id),
      supabase.from("psychologist_countries").select("country_code").eq("psychologist_id", psy.id),
    ]);
    selectedApproaches = (a ?? []).map((r) => r.approach_id);
    selectedSpecialties = (s ?? []).map((r) => r.specialty_id);
    selectedCountries = (c ?? []).map((r) => r.country_code);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Meu perfil</h1>
        <p className="mt-1 text-foreground-muted">
          Monte seu perfil e solicite a verificação do seu CRP. Ele só aparece
          na busca após ser aprovado.
        </p>
      </div>

      <OnboardingForm
        psy={psy}
        approaches={(approaches as Approach[]) ?? []}
        specialties={(specialties as Specialty[]) ?? []}
        selectedApproaches={selectedApproaches}
        selectedSpecialties={selectedSpecialties}
        selectedCountries={selectedCountries}
      />
    </div>
  );
}
