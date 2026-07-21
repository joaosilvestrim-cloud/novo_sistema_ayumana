import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const r = await s.from("profiles").select("id, full_name, email, role").ilike("full_name", "%sicologo%teste%");
if (r.error) { console.log("ERRO:", r.error.message); process.exit(1); }
console.log("encontrados:", r.data?.length ?? 0);
for (const p of (r.data ?? [])) {
  const y = await s.from("psychologists").select("id,is_published").eq("profile_id", p.id).maybeSingle();
  console.log(`- ${p.full_name} <${p.email}> id=${p.id} role=${p.role} | perfil_psicologo=${y.data ? y.data.id : "NAO EXISTE"}`);
}
