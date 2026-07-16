// Importa terapeutas do sistema antigo para o novo (psychologists).
//
// MODO A (recomendado) — um arquivo com o JOIN já feito:
//   node scripts/import-therapists.mjs "therapists_users_join.sql"
//
// MODO B — dois arquivos, SE o dump de users tiver a coluna id:
//   node scripts/import-therapists.mjs "therapists.sql" "users.sql"
//
// Requer migrations 0001-0003. Usa service_role.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Uso: node scripts/import-therapists.mjs "join.sql"  (ou therapists.sql users.sql)');
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// ---- Parser de INSERT ... (cols) VALUES (...) lendo as colunas do header ----
function parseInsert(sql) {
  const rows = [];
  // Tolera nome de tabela com espaços/aspas (DBeaver às vezes usa a query como nome).
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
      const fields = [];
      let cur = "", inStr = false, quoted = false;
      while (i < sql.length) {
        const ch = sql[i];
        if (inStr) {
          if (ch === "'") { if (sql[i + 1] === "'") { cur += "'"; i += 2; continue; } inStr = false; i++; continue; }
          cur += ch; i++; continue;
        }
        if (ch === "'") { inStr = true; quoted = true; i++; continue; }
        if (ch === ",") { fields.push(norm(cur, quoted)); cur = ""; quoted = false; i++; continue; }
        if (ch === ")") { fields.push(norm(cur, quoted)); i++; break; }
        cur += ch; i++;
      }
      const obj = {};
      cols.forEach((c, idx) => (obj[c] = fields[idx] ?? null));
      rows.push(obj);
    }
  }
  return rows;
}
function norm(raw, wasString) {
  if (wasString) return raw;
  const t = raw.trim();
  if (t === "" || t.toUpperCase() === "NULL") return null;
  if (t === "true") return true;
  if (t === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

// ---- Mapeamentos ----
const GENDER = { AA: "feminino", AO: "masculino", TF: "feminino", NB: "nao_binario" };
const APPROACH = { CL: "tcc", PA: "psicanalise", HA: "humanista" };
const EXTERIOR_RE = /exterior|fora do pa[ií]s|brasileir[oa]s?\s+(no|que\s+(vivem|moram)|fora)|imigrante|expatriad/i;

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<\/p>/gi, "\n\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&#39;|&rsquo;/gi, "'").replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}
function slugify(input) {
  return String(input).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}
function userName(r) {
  if (r.name) return String(r.name).trim();
  return [r.first_name, r.last_name, r.firstname, r.lastname]
    .filter(Boolean).map((x) => String(x).trim()).join(" ").trim();
}
function userEmail(r) { return String(r.email ?? r.email_address ?? "").trim(); }
function fullPhone(r) {
  const cc = String(r.phone_country_code ?? "").replace(/\D/g, "");
  const p = String(r.phone_whatsapp ?? r.phone ?? r.whatsapp ?? r.celular ?? "").replace(/\D/g, "");
  if (!p) return null;
  if (cc && !p.startsWith(cc)) return cc + p;
  return p;
}

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    const f = data?.users?.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (f) return f;
    if (!data || data.users.length < 1000) break;
  }
  return null;
}

function buildRows() {
  if (files.length === 1) return parseInsert(readFileSync(files[0], "utf8"));
  const therapists = parseInsert(readFileSync(files[0], "utf8"));
  const users = parseInsert(readFileSync(files[1], "utf8"));
  if (!users[0] || !("id" in users[0])) {
    console.error("✗ O dump de users não tem a coluna 'id'. Use o modo de arquivo único (JOIN).");
    process.exit(1);
  }
  const byId = new Map(users.map((u) => [String(u.id), u]));
  return therapists.map((t) => ({ ...(byId.get(String(t.user_id)) || {}), ...t }));
}

async function run() {
  const rows = buildRows();
  console.log(`Registros no arquivo: ${rows.length}\n`);

  const { data: apprs } = await supabase.from("approaches").select("id, slug");
  const apprId = Object.fromEntries((apprs ?? []).map((a) => [a.slug, a.id]));

  let ok = 0, skipNoEmail = 0, fail = 0, published = 0;

  for (const r of rows) {
    const email = userEmail(r);
    if (!email || !email.includes("@")) { skipNoEmail++; continue; }
    const name = userName(r) || email.split("@")[0];
    const bio = stripHtml(r.profile_description);
    const hasCrp = !!(r.crp && String(r.crp).trim());
    const publish = hasCrp && r.appears_in_showcase === true;

    let userId;
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email, email_confirm: true, user_metadata: { full_name: name },
    });
    if (cErr) {
      const ex = await findUserByEmail(email);
      if (!ex) { console.error(`✗ ${email}: ${cErr.message}`); fail++; continue; }
      userId = ex.id;
    } else userId = created.user.id;

    await supabase.from("profiles").upsert({ id: userId, full_name: name, email, role: "psicologo" });

    const channel = r.service_channel;
    const payload = {
      profile_id: userId,
      display_name: name,
      headline: bio ? bio.split("\n")[0].slice(0, 140) : null,
      bio: bio || null,
      gender: GENDER[r.gender_identity] ?? "prefiro_nao_dizer",
      crp_number: hasCrp ? String(r.crp).trim() : null,
      city: r.city || null,
      country: "BR",
      phone_whatsapp: fullPhone(r),
      accepts_online: channel === "ON" || channel === "ALL" || !channel,
      accepts_in_person: channel === "ALL" || channel === "PR",
      attends_abroad: EXTERIOR_RE.test(bio),
      languages: ["pt"],
      profile_completed: !!(hasCrp && bio),
      verification_status: publish ? "aprovado" : "nao_enviado",
      verified_at: publish ? new Date().toISOString() : null,
      is_published: publish,
    };

    const { data: existing } = await supabase
      .from("psychologists").select("id").eq("profile_id", userId).maybeSingle();
    let psyId = existing?.id;
    if (psyId) await supabase.from("psychologists").update(payload).eq("id", psyId);
    else {
      const { data: ins, error: iErr } = await supabase
        .from("psychologists").insert(payload).select("id").single();
      if (iErr) { console.error(`✗ ${email} (psy): ${iErr.message}`); fail++; continue; }
      psyId = ins.id;
    }

    await supabase.from("psychologists")
      .update({ slug: `${slugify(name)}-${psyId.slice(0, 6)}` }).eq("id", psyId);

    const apprSlug = APPROACH[r.therapeutic_approach];
    if (apprSlug && apprId[apprSlug]) {
      await supabase.from("psychologist_approaches")
        .upsert({ psychologist_id: psyId, approach_id: apprId[apprSlug] });
    }

    ok++;
    if (publish) published++;
  }

  console.log(`\n✓ Importados: ${ok} (publicados: ${published}) · sem email: ${skipNoEmail} · falhas: ${fail}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
