// Importa os handles de Instagram de um CSV para psychologists.instagram,
// casando por e-mail. Requer a coluna instagram (migration 0006).
// Uso: node scripts/import-instagram.mjs "caminho/instagram-padronizado.csv"
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const file = process.argv[2];
if (!file) { console.error('Uso: node scripts/import-instagram.mjs "arquivo.csv"'); process.exit(1); }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Parser CSV simples (RFC4180: aspas duplas, vírgula, "" escapado).
function parseCsv(text) {
  const rows = [];
  let field = "", row = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* ignore */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function handle(raw) {
  if (!raw) return null;
  let h = String(raw).trim();
  const m = h.match(/instagram\.com\/([^/?#\s]+)/i);
  if (m) h = m[1];
  h = h.replace(/^@+/, "").trim();
  if (!h || /\s/.test(h)) return null;
  return h;
}

async function run() {
  const rows = parseCsv(readFileSync(file, "utf8"));
  const header = rows.shift().map((h) => h.trim());
  const iEmail = header.indexOf("email");
  const iPad = header.indexOf("instagram_padronizado");
  if (iEmail < 0 || iPad < 0) { console.error("CSV precisa ter as colunas email e instagram_padronizado."); process.exit(1); }

  // email -> psychologist_id
  const { data: profs } = await s.from("profiles").select("id, email");
  const idByEmail = new Map((profs ?? []).map((p) => [(p.email || "").toLowerCase(), p.id]));
  const { data: psys } = await s.from("psychologists").select("id, profile_id");
  const psyByProfile = new Map((psys ?? []).map((p) => [p.profile_id, p.id]));

  let ok = 0, semHandle = 0, semMatch = 0;
  for (const r of rows) {
    if (!r || r.length <= iPad) continue;
    const email = (r[iEmail] || "").trim().toLowerCase();
    const ig = handle(r[iPad]);
    if (!email) continue;
    if (!ig) { semHandle++; continue; }
    const profId = idByEmail.get(email);
    const psyId = profId ? psyByProfile.get(profId) : null;
    if (!psyId) { semMatch++; continue; }
    const { error } = await s.from("psychologists").update({ instagram: ig }).eq("id", psyId);
    if (error) { console.error(`✗ ${email}: ${error.message}`); continue; }
    ok++;
  }
  console.log(`✓ Instagram atualizado: ${ok} · sem handle válido: ${semHandle} · sem match no sistema: ${semMatch}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
