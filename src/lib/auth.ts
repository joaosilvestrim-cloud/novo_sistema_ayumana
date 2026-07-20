import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Psychologist } from "@/lib/types";

/** Usuário autenticado (ou null). */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Perfil do usuário logado (ou null). */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
}

/** Exige login; redireciona para /login se não houver. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige papel admin. */
export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/painel");
  return profile;
}

/** Exige papel de conteúdo/estúdio (ou admin). */
export async function requireContentStaff(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "conteudo" && profile.role !== "admin") redirect("/painel");
  return profile;
}

/** Perfil profissional do psicólogo logado (ou null). */
export async function getMyPsychologist(): Promise<Psychologist | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("psychologists")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();
  return (data as Psychologist) ?? null;
}
