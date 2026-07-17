// Aplica WhatsApp (E.164) e CRP padronizados de um CSV, casando por e-mail.
// Regras:
//  - phone: usa whatsapp_e164 (só dígitos). Se status_whatsapp != OK => vazio.
//  - crp: usa crp_padronizado quando status_crp = OK. Senão não mexe.
//  - despublica 4 cadastros internos (não-psicólogos).
// Uso: node scripts/update-crp-phone.mjs "caminho/whatsapp-crp-padronizado2.csv"
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const file = process.argv[2];
if (!file) { console.error('Uso: node scripts/update-crp-phone.mjs "arquivo.csv"'); process.exit(1); }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Cadastros internos / não-psicólogos: fora do catálogo.
const INTERNOS = new Set([
  "juliana.ferreira@a2f.com.br",
  "gerson@hashinvest.com.br",
  "gemazer@gmail.com",
  "gabriela.martins191@hotmail.com",
]);

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
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function run() {
  const rows = parseCsv(readFileSync(file, "utf8"));
  const header = rows.shift().map((h) => h.trim());
  const col = (n) => header.indexOf(n);
  const iEmail = col("email"), iE164 = col("whatsapp_e164"), iStatWa = col("status_whatsapp");
  const iCrp = col("crp_padronizado"), iStatCrp = col("status_crp");

  const { data: profs } = await s.from("profiles").select("id, email");
  const idByEmail = new Map((profs ?? []).map((p) => [(p.email || "").toLowerCase(), p.id]));
  const { data: psys } = await s.from("psychologists").select("id, profile_id");
  const psyByProfile = new Map((psys ?? []).map((p) => [p.profile_id, p.id]));

  let updPhone = 0, phoneBlank = 0, updCrp = 0, semMatch = 0, internos = 0;
  for (const r of rows) {
    if (!r || r.length <= iCrp) continue;
    const email = (r[iEmail] || "").trim().toLowerCase();
    if (!email) continue;
    const profId = idByEmail.get(email);
    const psyId = profId ? psyByProfile.get(profId) : null;
    if (!psyId) { semMatch++; continue; }

    const update = {};
    // telefone
    if ((r[iStatWa] || "").trim() === "OK") {
      const digits = (r[iE164] || "").replace(/\D/g, "");
      if (digits) { update.phone_whatsapp = digits; updPhone++; }
    } else {
      update.phone_whatsapp = null; phoneBlank++;
    }
    // crp
    if ((r[iStatCrp] || "").trim() === "OK") {
      const crp = (r[iCrp] || "").trim();
      if (crp) { update.crp_number = crp; updCrp++; }
    }

    if (Object.keys(update).length) {
      await s.from("psychologists").update(update).eq("id", psyId);
    }
  }

  // Despublica os internos
  for (const email of INTERNOS) {
    const profId = idByEmail.get(email);
    const psyId = profId ? psyByProfile.get(profId) : null;
    if (!psyId) continue;
    await s.from("psychologists").update({ is_published: false, verification_status: "nao_enviado" }).eq("id", psyId);
    internos++;
  }

  console.log(`✓ telefone padronizado: ${updPhone} · telefone zerado: ${phoneBlank} · CRP padronizado: ${updCrp}`);
  console.log(`✓ internos despublicados: ${internos} · sem match: ${semMatch}`);

  const c = async (f) => { let q = s.from("psychologists").select("*", { count: "exact", head: true }); if (f) q = f(q); const { count } = await q; return count; };
  console.log("publicados agora:", await c((x) => x.eq("is_published", true)));
  console.log("com CRP:", await c((x) => x.not("crp_number", "is", null)));
}

run().catch((e) => { console.error(e); process.exit(1); });
