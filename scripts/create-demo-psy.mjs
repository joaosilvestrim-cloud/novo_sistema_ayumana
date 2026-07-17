// Cria (ou atualiza) um psicólogo de DEMONSTRAÇÃO com todos os campos preenchidos.
// Para remover depois: node scripts/create-demo-psy.mjs --delete
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv"; dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const EMAIL = "demo.perfil@ayumana.com.br";

async function findUser() {
  const { data } = await s.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return (data?.users || []).find((u) => u.email === EMAIL) || null;
}

if (process.argv.includes("--delete")) {
  const u = await findUser();
  if (u) { await s.auth.admin.deleteUser(u.id); console.log("demo apagado"); }
  else console.log("nada para apagar");
  process.exit(0);
}

// 1) usuário
let userId;
const { data: c, error: ce } = await s.auth.admin.createUser({ email: EMAIL, password: "AyumanaDemo!2026", email_confirm: true, user_metadata: { full_name: "Dra. Ana Exemplo" } });
if (ce) { const u = await findUser(); userId = u?.id; } else userId = c.user.id;
await s.from("profiles").upsert({ id: userId, full_name: "Dra. Ana Exemplo", email: EMAIL, role: "psicologo" });

// 2) psychologist
const payload = {
  profile_id: userId,
  display_name: "Dra. Ana Exemplo",
  headline: "Perfil de demonstração — psicóloga clínica para brasileiros na Europa.",
  bio: "Este é um perfil de exemplo da Ayumana, com todos os campos preenchidos para demonstração.\n\nMeu trabalho é voltado ao acolhimento de brasileiros que vivem fora do país, com foco em ansiedade, saudade e adaptação cultural. Ofereço um espaço seguro e sem julgamentos.",
  gender: "feminino",
  avatar_url: "https://api.dicebear.com/7.x/avataaars/png?seed=AnaExemplo&backgroundColor=b6e3f4",
  crp_number: "06/000000",
  city: "Lisboa (Portugal)",
  country: "BR",
  phone_whatsapp: "351900000000",
  instagram: "ayumana",
  timezone: "Europe/Lisbon",
  schedule: {
    seg: { open: "09:00", close: "18:00" },
    ter: { open: "09:00", close: "18:00" },
    qua: { open: "09:00", close: "18:00" },
    qui: { open: "09:00", close: "18:00" },
    sex: { open: "09:00", close: "13:00" },
    sab: { open: "09:00", close: "12:00" },
    dom: null,
  },
  accepting_patients: true,
  formation: "Graduação em Psicologia pela USP.\nEspecialização em Terapia Cognitivo-Comportamental.\nFormação em Psicologia Transcultural.",
  services: ["Psicoterapia individual", "Terapia de casal", "Orientação a brasileiros no exterior"],
  style: { direcao: 30, estrutura: 25, tom: 22, foco: 72, registro: 32 },
  session_price_cents: 18000,
  session_price_in_person_cents: 22000,
  video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  accepts_online: true,
  accepts_in_person: true,
  attends_abroad: true,
  audiences: ["adulto", "adolescente", "casal"],
  languages: ["pt", "en"],
  plan_tier: "ideal",
  profile_completed: true,
  verification_status: "aprovado",
  verified_at: new Date().toISOString(),
  is_published: true,
};

const { data: ex } = await s.from("psychologists").select("id").eq("profile_id", userId).maybeSingle();
let psyId = ex?.id;
if (psyId) await s.from("psychologists").update(payload).eq("id", psyId);
else { const { data: ins } = await s.from("psychologists").insert(payload).select("id").single(); psyId = ins.id; }

const slug = `dra-ana-exemplo-${psyId.slice(0, 6)}`;
await s.from("psychologists").update({ slug }).eq("id", psyId);

// abordagens e especialidades
const { data: apprs } = await s.from("approaches").select("id, slug");
const { data: specs } = await s.from("specialties").select("id, slug");
const aId = Object.fromEntries((apprs || []).map((a) => [a.slug, a.id]));
const sId = Object.fromEntries((specs || []).map((x) => [x.slug, x.id]));
await s.from("psychologist_approaches").delete().eq("psychologist_id", psyId);
await s.from("psychologist_approaches").insert(["tcc", "humanista", "act"].map((k) => ({ psychologist_id: psyId, approach_id: aId[k] })).filter((r) => r.approach_id));
await s.from("psychologist_specialties").delete().eq("psychologist_id", psyId);
await s.from("psychologist_specialties").insert(["ansiedade", "saudade", "adaptacao-cultural", "relacionamentos"].map((k) => ({ psychologist_id: psyId, specialty_id: sId[k] })).filter((r) => r.specialty_id));
await s.from("psychologist_countries").delete().eq("psychologist_id", psyId);
await s.from("psychologist_countries").insert(["PT", "GB", "IE"].map((code) => ({ psychologist_id: psyId, country_code: code })));

console.log("✓ demo criado:", `/psicologo/${slug}`);
