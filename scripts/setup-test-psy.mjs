import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const PROFILE_ID = "258f28c5-4e17-4aeb-9241-dac4ea52aadc";

const { data: existing } = await s.from("psychologists").select("id").eq("profile_id", PROFILE_ID).maybeSingle();
if (existing) { console.log("já existe:", existing.id); process.exit(0); }

const payload = {
  profile_id: PROFILE_ID,
  display_name: "Psicólogo Teste",
  headline: "Conta de teste interna da Ayumana. Não publicada no catálogo.",
  bio: "<p>Perfil de teste usado pela equipe para validar assinatura e cobrança. Não aparece na busca pública.</p>",
  gender: "outro",
  crp_number: "06/999999",
  crp_uf: "SP",
  city: "São Paulo",
  state: "SP",
  phone_whatsapp: "5511999999999",
  accepts_online: true,
  accepts_in_person: false,
  attends_abroad: false,
  audiences: ["adulto"],
  languages: ["pt"],
  timezone: "America/Sao_Paulo",
  accepting_patients: false,
  plan_tier: "essencial",
  subscription_status: "nenhuma",
  verification_status: "nao_enviado",
  profile_completed: true,
  is_published: false,   // conta de teste nunca vai para o catálogo
};

const { data: ins, error } = await s.from("psychologists").insert(payload).select("id").single();
if (error) { console.error("ERRO:", error.message); process.exit(1); }
await s.from("psychologists").update({ slug: `psicologo-teste-${ins.id.slice(0,6)}` }).eq("id", ins.id);
console.log("✓ perfil profissional criado:", ins.id);
console.log("  publicado: NÃO | plano: essencial | pronto para assinar");
