// Importa terapeutas do sistema antigo, casando therapists.user_id = users.id.
// Uso: node scripts/import-therapists.mjs "therapists.sql" "users.sql"
// IMPORTANTE: o dump de users PRECISA conter a coluna id.
// Requer migrations 0001-0003. Usa service_role.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const [therapistsFile, usersFile] = process.argv.slice(2);
if (!therapistsFile || !usersFile) {
  console.error('Uso: node scripts/import-therapists.mjs "therapists.sql" "users.sql"');
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---- Parser de INSERT ... (cols) VALUES (...) que lê as colunas do header ----
function parseInsert(sql) {
  const rows = [];
  const re = /INSERT INTO\s+\S+\s*\(([^)]*)\)\s*VALUES/gi;
  let m;
  while ((m = re.exec(sql))) {
    const cols = m[1]
      .split(",")
      .map((c) => c.trim().replace(/^"|"$/g, ""));
    let i = re.lastIndex;
    // lê tuplas até ';' de nível superior
    while (i < sql.length) {
      while (i < sql.length && /[\s,]/.test(sql[i])) i++;
      if (sql[i] === ";") { i++; break; }
      if (sql[i] !== "(") { if (i >= sql.length) break; i++; continue; }
      i++;
      const fields = [];
      let cur = "", inStr = false, started = false;
      while (i < sql.length) {
        const ch = sql[i];
        if (inStr) {
          if (ch === "'") {
            if (sql[i + 1] === "'") { cur += "'"; i += 2; continue; }
            inStr = false; i++; continue;
          }
          cur += ch; i++; continue;
        }
        if (ch === "'") { inStr = true; started = true; i++; continue; }
        if (ch === ",") { fields.push(norm(cur, started)); cur = ""; started = false; i++; continue; }
        if (ch === ")") { fields.push(norm(cur, started)); i++; break; }
        cur += ch; if (!/\s/.test(ch)) started = true; i++;
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

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&rsquo;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function slugify(input) {
  return input
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

const EXTERIOR_RE = /exterior|fora do pa[ií]s|brasileir[oa]s?\s+(no|que\s+(vivem|moram)|fora)|imigrante|expatriad/i;

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    const f = data?.users?.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (f) return f;
    if (!data || data.users.length < 1000) break;
  }
  return null;
}

async function run() {
  const therapists = parseInsert(readFileSync(therapistsFile, "utf8"));
  const users = parseInsert(readFileSync(usersFile, "utf8"));

  if (!users.length || !("id" in users[0])) {
    console.error("✗ O dump de users precisa conter a coluna 'id'. Reexporte incluindo o id.");
    process.exit(1);
  }
  const userById = new Map(users.map((u) => [String(u.id), u]));

  // Mapa de abordagem slug -> id.
  const { data: apprs } = await supabase.from("approaches").select("id, slug");
  const apprId = Object.fromEntries((apprs ?? []).map((a) => [a.slug, a.id]));

  let ok = 0, skipNoUser = 0, skipNoEmail = 0, fail = 0, published = 0;

  for (const t of therapists) {
    const u = userById.get(String(t.user_id));
    if (!u) { skipNoUser++; continue; }
    const email = (u.email || "").trim();
    if (!email) { skipNoEmail++; continue; }

    const name = (u.name || "").trim();
    const bio = stripHtml(t.profile_description);
    const hasCrp = !!(t.crp && String(t.crp).trim());
    const publish = hasCrp && t.appears_in_showcase === true;

    // 1) conta auth
    let userId;
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (cErr) {
      const ex = await findUserByEmail(email);
      if (!ex) { console.error(`✗ ${email}: ${cErr.message}`); fail++; continue; }
      userId = ex.id;
    } else userId = created.user.id;

    // 2) profile
    await supabase.from("profiles").upsert({ id: userId, full_name: name, email, role: "psicologo" });

    // 3) psychologist
    const phone = (u.phone_whatsapp || "").replace(/\D/g, "") || null;
    const channel = t.service_channel; // ON | ALL | PR
    const payload = {
      profile_id: userId,
      display_name: name,
      headline: bio ? bio.split("\n")[0].slice(0, 140) : null,
      bio: bio || null,
      gender: GENDER[t.gender_identity] ?? "prefiro_nao_dizer",
      crp_number: hasCrp ? String(t.crp).trim() : null,
      city: t.city || null,
      country: "BR",
      phone_whatsapp: phone,
      accepts_online: channel === "ON" || channel === "ALL",
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

    // slug
    const slug = `${slugify(name)}-${psyId.slice(0, 6)}`;
    await supabase.from("psychologists").update({ slug }).eq("id", psyId);

    // abordagem
    const apprSlug = APPROACH[t.therapeutic_approach];
    if (apprSlug && apprId[apprSlug]) {
      await supabase.from("psychologist_approaches")
        .upsert({ psychologist_id: psyId, approach_id: apprId[apprSlug] });
    }

    ok++;
    if (publish) published++;
  }

  console.log(`\n✓ Terapeutas importados: ${ok} (publicados: ${published})`);
  console.log(`  sem match de user: ${skipNoUser} · sem email: ${skipNoEmail} · falhas: ${fail}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
