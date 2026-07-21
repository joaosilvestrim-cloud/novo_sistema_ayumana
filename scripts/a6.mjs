import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const show = async (label, r) => {
  if (r.error) return console.log(label, "ERRO:", r.error.message);
  console.log(label, `(${r.data?.length ?? 0})`);
  for (const p of (r.data ?? [])) {
    const y = await s.from("psychologists").select("display_name,is_published,verification_status,crp_number,bio").eq("profile_id", p.id).maybeSingle();
    const d = y.data;
    console.log(`  · ${p.full_name} <${p.email}> role=${p.role} | pub=${d?.is_published ?? "sem perfil"} verif=${d?.verification_status ?? "-"} crp=${d?.crp_number ?? "-"} bio=${d?.bio ? d.bio.length+"ch" : "vazia"}`);
  }
};
await show("EMAIL com 'teste':", await s.from("profiles").select("id,full_name,email,role").ilike("email","%teste%"));
await show("NOME com 'teste':", await s.from("profiles").select("id,full_name,email,role").ilike("full_name","%teste%"));
await show("NOME com 'estudio':", await s.from("profiles").select("id,full_name,email,role").ilike("full_name","%estudio%"));
await show("Juliana (julianxpereirx):", await s.from("profiles").select("id,full_name,email,role").ilike("email","julianxpereirx%"));
await show("Silvestrim (emails parecidos):", await s.from("profiles").select("id,full_name,email,role").ilike("email","%silvestrim%"));
