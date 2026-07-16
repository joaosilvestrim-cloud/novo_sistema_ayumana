// Popula o catálogo com psicólogos de exemplo (verificados e publicados).
// Requer a migration 0001 aplicada. Usa a service_role (ignora RLS).
// Uso: npm run db:seed
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "ayumana-demo-2026";

const PEOPLE = [
  {
    email: "mariana.demo@ayumana.com.br",
    full_name: "Mariana Alves",
    display_name: "Mariana Alves",
    gender: "feminino",
    crp_number: "06/112233",
    crp_uf: "SP",
    headline: "Psicóloga clínica para brasileiras que recomeçam a vida no exterior.",
    bio: "Atendo mulheres brasileiras vivendo fora do país há mais de 8 anos. Trabalho saudade, adaptação cultural e maternidade longe da rede de apoio, num espaço acolhedor e em português.",
    city: "São Paulo", state: "SP", plan_tier: "ideal",
    phone_whatsapp: "5511999990001", session_price_cents: 18000,
    accepts_online: true, accepts_in_person: false, attends_abroad: true,
    audiences: ["adulto", "casal"], languages: ["pt", "en"],
    timezones: ["Europe/Lisbon", "America/Sao_Paulo"],
    approaches: ["tcc", "act"],
    specialties: ["ansiedade", "saudade", "maternidade-exterior", "adaptacao-cultural"],
    countries: ["PT", "IE", "GB"],
  },
  {
    email: "rafael.demo@ayumana.com.br",
    full_name: "Rafael Souza",
    display_name: "Rafael Souza",
    gender: "masculino",
    crp_number: "07/445566",
    crp_uf: "RS",
    headline: "Terapia para homens: ansiedade, carreira e relacionamentos à distância.",
    bio: "Psicólogo com foco em população masculina e brasileiros expatriados. Abordagem prática para lidar com estresse, identidade e distância da família.",
    city: "Porto Alegre", state: "RS", plan_tier: "destaque",
    phone_whatsapp: "5551999990002", session_price_cents: 15000,
    accepts_online: true, accepts_in_person: false, attends_abroad: true,
    audiences: ["adulto"], languages: ["pt", "es"],
    timezones: ["America/New_York", "America/Sao_Paulo"],
    approaches: ["psicanalise"],
    specialties: ["ansiedade", "carreira", "relacionamento-distancia", "identidade"],
    countries: ["US", "CA"],
  },
  {
    email: "juliana.demo@ayumana.com.br",
    full_name: "Juliana Ferreira",
    display_name: "Juliana Ferreira",
    gender: "feminino",
    crp_number: "05/778899",
    crp_uf: "RJ",
    headline: "Luto, depressão e reconstrução de sentido.",
    bio: "Acompanho processos de luto e depressão com escuta cuidadosa. Atendo adultos e idosos, no Brasil e no exterior.",
    city: "Rio de Janeiro", state: "RJ", plan_tier: "essencial",
    phone_whatsapp: "5521999990003", session_price_cents: null,
    accepts_online: true, accepts_in_person: true, attends_abroad: false,
    audiences: ["adulto", "idoso"], languages: ["pt"],
    timezones: ["America/Sao_Paulo"],
    approaches: ["humanista", "gestalt"],
    specialties: ["luto", "depressao", "autoestima"],
    countries: [],
  },
  {
    email: "camila.demo@ayumana.com.br",
    full_name: "Camila Nunes",
    display_name: "Camila Nunes",
    gender: "feminino",
    crp_number: "08/223344",
    crp_uf: "PR",
    headline: "Crianças, adolescentes e filhos bilíngues no exterior.",
    bio: "Especialista em infância e adolescência. Ajudo famílias brasileiras a criarem filhos bilíngues e a lidarem com a adaptação das crianças em um novo país.",
    city: "Curitiba", state: "PR", plan_tier: "ideal",
    phone_whatsapp: "5541999990004", session_price_cents: 20000,
    accepts_online: true, accepts_in_person: false, attends_abroad: true,
    audiences: ["crianca", "adolescente"], languages: ["pt", "en"],
    timezones: ["Europe/Dublin", "Australia/Sydney"],
    approaches: ["tcc", "sistemica"],
    specialties: ["filhos-bilingues", "adaptacao-cultural", "ansiedade"],
    countries: ["IE", "AU", "GB"],
  },
  {
    email: "pedro.demo@ayumana.com.br",
    full_name: "Pedro Henrique Lima",
    display_name: "Pedro Henrique Lima",
    gender: "masculino",
    crp_number: "06/556677",
    crp_uf: "SP",
    headline: "Casais e relacionamentos à distância.",
    bio: "Terapia de casal, inclusive para quem vive em fusos diferentes. Foco em comunicação e reconexão.",
    city: "Campinas", state: "SP", plan_tier: "destaque",
    phone_whatsapp: "5519999990005", session_price_cents: 22000,
    accepts_online: true, accepts_in_person: false, attends_abroad: true,
    audiences: ["casal", "adulto"], languages: ["pt", "en", "es"],
    timezones: ["Europe/Berlin", "America/Sao_Paulo"],
    approaches: ["sistemica"],
    specialties: ["relacionamentos", "relacionamento-distancia"],
    countries: ["DE", "ES", "NL"],
  },
  {
    email: "beatriz.demo@ayumana.com.br",
    full_name: "Beatriz Costa",
    display_name: "Beatriz Costa",
    gender: "feminino",
    crp_number: "04/889900",
    crp_uf: "MG",
    headline: "Ansiedade e pânico com base em evidências.",
    bio: "Trabalho ansiedade, síndrome do pânico e estresse com TCC. Sessões online para todo o Brasil e brasileiros no Japão.",
    city: "Belo Horizonte", state: "MG", plan_tier: "essencial",
    phone_whatsapp: "5531999990006", session_price_cents: null,
    accepts_online: true, accepts_in_person: false, attends_abroad: true,
    audiences: ["adulto"], languages: ["pt"],
    timezones: ["Asia/Tokyo", "America/Sao_Paulo"],
    approaches: ["tcc"],
    specialties: ["ansiedade", "panico", "estresse", "solidao-exterior"],
    countries: ["JP"],
  },
];

async function findUserByEmail(email) {
  // Percorre páginas até achar (base pequena no seed).
  for (let page = 1; page <= 10; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const found = data?.users?.find((u) => u.email === email);
    if (found) return found;
    if (!data || data.users.length < 200) break;
  }
  return null;
}

async function slugMaps() {
  const [{ data: specs }, { data: apps }] = await Promise.all([
    supabase.from("specialties").select("id, slug"),
    supabase.from("approaches").select("id, slug"),
  ]);
  const s = Object.fromEntries((specs ?? []).map((r) => [r.slug, r.id]));
  const a = Object.fromEntries((apps ?? []).map((r) => [r.slug, r.id]));
  return { s, a };
}

async function run() {
  const { s: specMap, a: apprMap } = await slugMaps();
  if (!Object.keys(specMap).length) {
    console.error("✗ Tabelas vazias. Rode a migration (npm run db:push) antes do seed.");
    process.exit(1);
  }

  for (const person of PEOPLE) {
    // 1) usuário auth (cria ou reaproveita).
    let userId;
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email: person.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: person.full_name },
    });
    if (cErr) {
      const existing = await findUserByEmail(person.email);
      if (!existing) {
        console.error(`✗ ${person.email}: ${cErr.message}`);
        continue;
      }
      userId = existing.id;
    } else {
      userId = created.user.id;
    }

    // 2) garante profile (o trigger normalmente já cria).
    await supabase.from("profiles").upsert({
      id: userId,
      full_name: person.full_name,
      email: person.email,
      role: "psicologo",
    });

    // 3) psychologist (upsert por profile_id).
    const { data: existingPsy } = await supabase
      .from("psychologists")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();

    const payload = {
      profile_id: userId,
      slug: null, // definido abaixo com o id
      display_name: person.display_name,
      headline: person.headline,
      bio: person.bio,
      gender: person.gender,
      crp_number: person.crp_number,
      crp_uf: person.crp_uf,
      city: person.city,
      state: person.state,
      country: "BR",
      plan_tier: person.plan_tier,
      phone_whatsapp: person.phone_whatsapp,
      session_price_cents: person.session_price_cents,
      accepts_online: person.accepts_online,
      accepts_in_person: person.accepts_in_person,
      attends_abroad: person.attends_abroad,
      audiences: person.audiences,
      languages: person.languages,
      timezones: person.timezones,
      profile_completed: true,
      verification_status: "aprovado",
      verified_at: new Date().toISOString(),
      is_published: true,
    };

    let psyId = existingPsy?.id;
    if (psyId) {
      await supabase.from("psychologists").update(payload).eq("id", psyId);
    } else {
      const { data: ins, error: iErr } = await supabase
        .from("psychologists")
        .insert(payload)
        .select("id")
        .single();
      if (iErr) {
        console.error(`✗ ${person.email} (psychologist): ${iErr.message}`);
        continue;
      }
      psyId = ins.id;
    }

    // slug com base no id.
    const slug = `${person.display_name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${psyId.slice(0, 6)}`;
    await supabase.from("psychologists").update({ slug }).eq("id", psyId);

    // 4) joins.
    await supabase.from("psychologist_specialties").delete().eq("psychologist_id", psyId);
    const specRows = person.specialties
      .map((slugKey) => specMap[slugKey])
      .filter(Boolean)
      .map((specialty_id) => ({ psychologist_id: psyId, specialty_id }));
    if (specRows.length) await supabase.from("psychologist_specialties").insert(specRows);

    await supabase.from("psychologist_approaches").delete().eq("psychologist_id", psyId);
    const apprRows = person.approaches
      .map((slugKey) => apprMap[slugKey])
      .filter(Boolean)
      .map((approach_id) => ({ psychologist_id: psyId, approach_id }));
    if (apprRows.length) await supabase.from("psychologist_approaches").insert(apprRows);

    await supabase.from("psychologist_countries").delete().eq("psychologist_id", psyId);
    if (person.countries.length) {
      await supabase
        .from("psychologist_countries")
        .insert(person.countries.map((country_code) => ({ psychologist_id: psyId, country_code })));
    }

    console.log(`✓ ${person.display_name} → /psicologo/${slug}`);
  }

  console.log("\n✓ Seed concluído.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
