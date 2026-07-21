import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const NOVOS = [
  { id: "essencial", name: "Raiz" },
  { id: "destaque",  name: "Alcance" },
  { id: "ideal",     name: "Voz" },
  { id: "presenca",  name: "Presença", features: ["Tudo do Voz","Presença digital gerida pela Ayumana","8 peças/mês + 1 revisão","Capacidade limitada (15 a 20 vagas)"] },
];
for (const p of NOVOS) {
  const patch = { name: p.name };
  if (p.features) patch.features = p.features;
  const r = await s.from("plans").update(patch).eq("id", p.id);
  console.log(r.error ? `erro ${p.id}: ${r.error.message}` : `✓ ${p.id} -> ${p.name}`);
}
