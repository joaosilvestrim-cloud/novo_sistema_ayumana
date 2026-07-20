// Ajustes pontuais na base:
// 1) Remove todas as respostas anônimas do fórum (mantém as perguntas).
// 2) Desmarca "Atende no exterior" (attends_abroad) de todos os psicólogos.
// Uso: node --env-file=.env.local scripts/platform-adjustments.mjs
import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// 1) Respostas anônimas
const { count: anonCount } = await s.from("forum_answers").select("id", { count: "exact", head: true }).eq("anonymous", true);
const { error: delErr } = await s.from("forum_answers").delete().eq("anonymous", true);
if (delErr) { console.error("Erro ao remover respostas anônimas:", delErr.message); process.exit(1); }
console.log(`✓ Respostas anônimas removidas: ${anonCount ?? "?"}`);

// 2) Atende no exterior
const { count: abroadCount } = await s.from("psychologists").select("id", { count: "exact", head: true }).eq("attends_abroad", true);
const { error: updErr } = await s.from("psychologists").update({ attends_abroad: false }).eq("attends_abroad", true);
if (updErr) { console.error("Erro ao desmarcar attends_abroad:", updErr.message); process.exit(1); }
console.log(`✓ "Atende no exterior" desmarcado em: ${abroadCount ?? "?"} psicólogos`);

console.log("Concluído.");
