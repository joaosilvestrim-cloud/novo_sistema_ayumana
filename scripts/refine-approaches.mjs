// Refina as abordagens dos psicólogos importados, detectando pelo texto da bio
// (além do código genérico CL/PA/HA). Cada psicólogo pode ter várias.
// Uso: node scripts/refine-approaches.mjs "join.sql"
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const file = process.argv[2];
if (!file) { console.error('Uso: node scripts/refine-approaches.mjs "join.sql"'); process.exit(1); }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// ---- Parser (mesmo do importador) ----
function parseInsert(sql) {
  const rows = [];
  const re = /INSERT INTO[\s\S]*?\(([^)]*)\)\s*VALUES/gi;
  let m;
  while ((m = re.exec(sql))) {
    const cols = m[1].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    let i = re.lastIndex;
    while (i < sql.length) {
      while (i < sql.length && /[\s,]/.test(sql[i])) i++;
      if (sql[i] === ";") { i++; break; }
      if (sql[i] !== "(") { if (i >= sql.length) break; i++; continue; }
      i++;
      const fields = []; let cur = "", inStr = false, quoted = false;
      while (i < sql.length) {
        const ch = sql[i];
        if (inStr) { if (ch === "'") { if (sql[i + 1] === "'") { cur += "'"; i += 2; continue; } inStr = false; i++; continue; } cur += ch; i++; continue; }
        if (ch === "'") { inStr = true; quoted = true; i++; continue; }
        if (ch === ",") { fields.push(norm(cur, quoted)); cur = ""; quoted = false; i++; continue; }
        if (ch === ")") { fields.push(norm(cur, quoted)); i++; break; }
        cur += ch; i++;
      }
      const o = {}; cols.forEach((c, idx) => (o[c] = fields[idx] ?? null)); rows.push(o);
    }
  }
  return rows;
}
function norm(raw, q) { if (q) return raw; const t = raw.trim(); if (t === "" || t.toUpperCase() === "NULL") return null; if (t === "true") return true; if (t === "false") return false; if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t); return t; }

function plain(html) {
  return String(html || "").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const CODE = { CL: "tcc", PA: "psicanalise", HA: "humanista" };

// Regras de detecção (slug -> regex sobre a bio sem acento/minúscula).
const RULES = [
  ["tcc", /cognitivo.?comportament|\btcc\b|terapia cognitiv|terapia do esquema|reestruturacao cognitiv/],
  ["psicanalise", /psicanalis|psicanalit|lacanian|freud|orientacao analitica/],
  ["psicodinamica", /psicodinamic/],
  ["gestalt", /gestalt/],
  ["humanista", /humanist|centrada na pessoa|abordagem centrada|fenomenologic|existencial|logoterapia|rogers|humanizad/],
  ["sistemica", /sistemic|terapia de familia|familiar sistem|relacional sistem|terapia familiar/],
  ["act", /aceitacao e compromisso|\bact\b|terapia de aceitacao/],
  ["analitico-comportamental", /analise do comportament|analitico.?comportament|analista do comportament|\baba\b/],
  ["junguiana", /junguian|\bjung\b|psicologia analitica|analitica junguian/],
  ["emdr", /\bemdr\b/],
];

function detect(bioHtml, code) {
  const text = plain(bioHtml);
  const set = new Set();
  for (const [slug, re] of RULES) if (re.test(text)) set.add(slug);
  // Fallback: se nada detectado, usa o código genérico.
  if (set.size === 0 && CODE[code]) set.add(CODE[code]);
  return [...set];
}

async function run() {
  const rows = parseInsert(readFileSync(file, "utf8"));

  const { data: apprs } = await supabase.from("approaches").select("id, slug");
  const apprId = Object.fromEntries((apprs ?? []).map((a) => [a.slug, a.id]));

  // email -> psychologist_id (duas queries; profiles tem 2 FKs -> evita ambiguidade)
  const { data: psys } = await supabase.from("psychologists").select("id, profile_id");
  const { data: profs } = await supabase.from("profiles").select("id, email");
  const emailById = new Map((profs ?? []).map((p) => [p.id, (p.email || "").toLowerCase()]));
  const byEmail = new Map();
  for (const p of psys ?? []) {
    const em = emailById.get(p.profile_id);
    if (em) byEmail.set(em, p.id);
  }

  let updated = 0, notFound = 0;
  const dist = {};
  for (const r of rows) {
    const email = String(r.email || "").toLowerCase();
    const psyId = byEmail.get(email);
    if (!psyId) { notFound++; continue; }

    const slugs = detect(r.profile_description, r.therapeutic_approach);
    if (!slugs.length) continue;

    await supabase.from("psychologist_approaches").delete().eq("psychologist_id", psyId);
    const insert = slugs.map((s) => apprId[s]).filter(Boolean)
      .map((approach_id) => ({ psychologist_id: psyId, approach_id }));
    if (insert.length) await supabase.from("psychologist_approaches").insert(insert);

    slugs.forEach((s) => (dist[s] = (dist[s] || 0) + 1));
    updated++;
  }

  console.log(`✓ Atualizados: ${updated} · não encontrados: ${notFound}`);
  console.log("Distribuição de abordagens:", dist);
}

run().catch((e) => { console.error(e); process.exit(1); });
