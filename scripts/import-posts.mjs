// Importa os artigos do sistema antigo (posts_*.sql) para blog_posts.
// Uso: node scripts/import-posts.mjs "C:/caminho/posts_....sql"
// Requer migration 0003 aplicada. Usa service_role.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const file = process.argv[2];
if (!file) {
  console.error('Uso: node scripts/import-posts.mjs "caminho/posts.sql"');
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

// Colunas do dump antigo, na ordem.
const COLS = [
  "title", "subtitle", "slug", "cover", "content", "tags",
  "created_at", "updated_at", "category_id", "author_name", "author_profile_picture",
];

/** Tokeniza as tuplas de VALUES respeitando strings ('' = aspa escapada). */
function parseTuples(sql) {
  const tuples = [];
  let i = 0;
  const n = sql.length;
  // Percorre cada bloco após "VALUES" até o ";".
  while (i < n) {
    const vIdx = sql.indexOf("VALUES", i);
    if (vIdx === -1) break;
    i = vIdx + "VALUES".length;
    // Lê tuplas até ';' de nível superior.
    while (i < n) {
      // pula espaços/vírgulas/quebras
      while (i < n && /[\s,]/.test(sql[i])) i++;
      if (i >= n) break;
      if (sql[i] === ";") { i++; break; }
      if (sql[i] !== "(") { i++; continue; }
      // parse de uma tupla
      i++; // consume '('
      const fields = [];
      let cur = "";
      let inStr = false;
      let started = false;
      while (i < n) {
        const ch = sql[i];
        if (inStr) {
          if (ch === "'") {
            if (sql[i + 1] === "'") { cur += "'"; i += 2; continue; }
            inStr = false; i++; continue;
          }
          cur += ch; i++; continue;
        }
        if (ch === "'") { inStr = true; started = true; cur = cur ?? ""; i++; continue; }
        if (ch === ",") { fields.push(normalize(cur, started)); cur = ""; started = false; i++; continue; }
        if (ch === ")") { fields.push(normalize(cur, started)); i++; break; }
        cur += ch; started = true; i++;
      }
      tuples.push(fields);
    }
  }
  return tuples;
}

function normalize(raw, wasString) {
  const t = raw.trim();
  if (wasString) return raw.startsWith(" ") ? raw : raw; // string literal (mantém conteúdo)
  if (t === "" ) return null;
  if (t.toUpperCase() === "NULL") return null;
  if (t === "true") return true;
  if (t === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

function tagsToCategory(tags) {
  const s = (tags || "").toLowerCase();
  if (/imigra|exterior|comunidade brasileira|adapta/.test(s)) return "exterior";
  if (/ansiedade|depress|luto|relacion|autoestima/.test(s)) return "saude-mental";
  return "geral";
}

async function run() {
  const sql = readFileSync(file, "utf8");
  const tuples = parseTuples(sql);
  console.log(`Encontrados ${tuples.length} artigos no dump.\n`);

  let ok = 0, skip = 0, fail = 0;
  for (const t of tuples) {
    const row = Object.fromEntries(COLS.map((c, idx) => [c, t[idx] ?? null]));
    if (!row.title || !row.slug || !row.content) { skip++; continue; }

    const payload = {
      title: String(row.title).trim(),
      slug: String(row.slug).trim(),
      excerpt: row.subtitle ? String(row.subtitle).trim() : null,
      content: String(row.content),
      cover_url: null, // arquivos de imagem não vieram no dump
      category: tagsToCategory(row.tags),
      author_name: row.author_name ? String(row.author_name).trim() : "Equipe Ayumana",
      published: true,
      published_at: toISO(row.created_at),
    };

    const { error } = await supabase
      .from("blog_posts")
      .upsert(payload, { onConflict: "slug" });
    if (error) { console.error(`✗ ${payload.slug}: ${error.message}`); fail++; }
    else { ok++; }
  }

  console.log(`\n✓ Importados/atualizados: ${ok} · ignorados: ${skip} · falhas: ${fail}`);
}

function toISO(v) {
  if (!v) return new Date().toISOString();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

run().catch((e) => { console.error(e); process.exit(1); });
