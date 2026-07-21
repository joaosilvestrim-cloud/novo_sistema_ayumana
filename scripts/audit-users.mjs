import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

console.log("=== contas suspeitas ===");
const { data: profs } = await s.from("profiles").select("id, full_name, email, role").or("full_name.ilike.%teste%,full_name.ilike.%test%,full_name.ilike.%exemplo%,full_name.ilike.%estudio%,email.ilike.%teste%,email.ilike.%julianxpereirx%");
for (const p of (profs??[])) {
  const { data: y } = await s.from("psychologists").select("display_name,is_published,verification_status,plan_tier,crp_number").eq("profile_id", p.id).maybeSingle();
  console.log(`- ${p.full_name} <${p.email}> role=${p.role} | pub=${y?.is_published ?? "-"} verif=${y?.verification_status ?? "-"} plano=${y?.plan_tier ?? "-"} crp=${y?.crp_number ?? "-"}`);
}

console.log("\n=== planos pagos ===");
const { data: pagos } = await s.from("psychologists").select("display_name,plan_tier,verification_status,is_published").neq("plan_tier","essencial");
(pagos??[]).forEach(y=>console.log(`- ${y.display_name} | ${y.plan_tier} | verif=${y.verification_status} | pub=${y.is_published}`));

console.log("\n=== forum pendentes ===");
const { data: pend } = await s.from("forum_questions").select("title").eq("status","pendente");
console.log(`pendentes=${pend?.length ?? 0}`);
(pend??[]).forEach(q=>console.log(`  · ${q.title}`));

console.log("\n=== Amanda (bio/headline) ===");
const { data: am } = await s.from("psychologists").select("display_name,headline,bio").ilike("display_name","%amanda%");
(am??[]).forEach(y=>console.log(`- ${y.display_name}\n  headline(${(y.headline||"").length}): ${y.headline}\n  bio(${(y.bio||"").length}): ${(y.bio||"").slice(0,120)}`));
