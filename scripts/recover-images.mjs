// Resgata imagens do sistema antigo: baixa da URL base, sobe pro Storage do
// Supabase e atualiza o banco.
//
//   node scripts/recover-images.mjs blog   <baseUrl> <posts_dump.sql>
//   node scripts/recover-images.mjs avatar <baseUrl> <users_dump.sql>
//
// <baseUrl> = onde os arquivos são servidos. O script tenta <baseUrl>/<arquivo>.
// Requer migrations 0003/0004 e os buckets (scripts/create-buckets.mjs).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const [mode, baseUrlRaw, dumpFile] = process.argv.slice(2);
if (!mode || !baseUrlRaw || !dumpFile) {
  console.error("Uso: node scripts/recover-images.mjs blog|avatar <baseUrl> <dump.sql>");
  process.exit(1);
}
const baseUrl = baseUrlRaw.replace(/\/+$/, "");
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// ---- parser de INSERT (lê colunas do header) ----
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

function ctype(name) {
  const e = name.split(".").pop().toLowerCase();
  return { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif" }[e] || "application/octet-stream";
}
function stem(name) { return name.replace(/\.[a-z0-9]+$/i, ""); }

async function fetchImage(filename) {
  const url = `${baseUrl}/${filename}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch {
    return null;
  }
}

async function upload(bucket, path, buf, filename) {
  const { error } = await s.storage.from(bucket).upload(path, buf, { contentType: ctype(filename), upsert: true });
  if (error) return null;
  return s.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function runBlog() {
  const rows = parseInsert(readFileSync(dumpFile, "utf8"));
  const { data: posts } = await s.from("blog_posts").select("id, slug");
  const bySlug = new Map((posts ?? []).map((p) => [p.slug, p.id]));

  let ok = 0, miss = 0, notFound = 0;
  for (const r of rows) {
    const capa = r.link_imagem_capa;
    if (!capa) continue;
    const slug = stem(capa);
    const postId = bySlug.get(slug);
    if (!postId) { notFound++; continue; }
    const buf = await fetchImage(capa);
    if (!buf) { miss++; console.warn(`  ✗ imagem não baixou: ${capa}`); continue; }
    const publicUrl = await upload("blog-images", capa, buf, capa);
    if (!publicUrl) { miss++; continue; }
    await s.from("blog_posts").update({ cover_url: publicUrl }).eq("id", postId);
    ok++;
  }
  console.log(`\n✓ Capas atualizadas: ${ok} · não baixadas: ${miss} · post não encontrado: ${notFound}`);
}

async function runAvatar() {
  const rows = parseInsert(readFileSync(dumpFile, "utf8"));
  const pic = (r) => r.profile_picture ?? r.photo ?? r.avatar ?? r.foto ?? null;
  const email = (r) => String(r.email ?? "").toLowerCase();

  // email -> psychologist_id
  const { data: psys } = await s.from("psychologists").select("id, profile_id");
  const { data: profs } = await s.from("profiles").select("id, email");
  const emailById = new Map((profs ?? []).map((p) => [p.id, (p.email || "").toLowerCase()]));
  const byEmail = new Map();
  for (const p of psys ?? []) { const em = emailById.get(p.profile_id); if (em) byEmail.set(em, p.id); }

  let ok = 0, miss = 0, notFound = 0, noPic = 0;
  for (const r of rows) {
    const file = pic(r);
    if (!file) { noPic++; continue; }
    const psyId = byEmail.get(email(r));
    if (!psyId) { notFound++; continue; }
    const buf = await fetchImage(file);
    if (!buf) { miss++; console.warn(`  ✗ imagem não baixou: ${file}`); continue; }
    const publicUrl = await upload("avatars", `${psyId}/${file}`, buf, file);
    if (!publicUrl) { miss++; continue; }
    await s.from("psychologists").update({ avatar_url: publicUrl }).eq("id", psyId);
    ok++;
  }
  console.log(`\n✓ Avatares atualizados: ${ok} · não baixadas: ${miss} · sem foto: ${noPic} · psicólogo não encontrado: ${notFound}`);
}

if (mode === "blog") await runBlog();
else if (mode === "avatar") await runAvatar();
else { console.error("modo inválido: use blog ou avatar"); process.exit(1); }
