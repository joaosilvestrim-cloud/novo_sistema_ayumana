// Resgata imagens do sistema antigo: lê de uma PASTA LOCAL (recomendado, após
// sincronizar o bucket S3) ou de uma URL base, sobe pro Storage do Supabase e
// atualiza o banco.
//
//   node scripts/recover-images.mjs blog   <pasta|baseUrl> <posts_dump.sql>
//   node scripts/recover-images.mjs avatar <pasta|baseUrl> [file_uploads_dump.sql]
//
// - <pasta> local: ex. "C:/aaa/media" (resultado de `aws s3 sync`).
// - Em modo avatar sem dump, o script varre a pasta procurando
//   "<email>_profile_picture.<ext>" e casa pelo e-mail do psicólogo.
// Requer migrations 0003/0004 e os buckets (npm run db:buckets).
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const [mode, source, dumpFile] = process.argv.slice(2);
if (!mode || !source) {
  console.error("Uso: node scripts/recover-images.mjs blog|avatar <pasta|baseUrl> [dump.sql]");
  process.exit(1);
}
const isUrl = /^https?:\/\//i.test(source);
const base = isUrl ? source.replace(/\/+$/, "") : source;
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// ---- parser de INSERT ----
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
const stem = (n) => n.replace(/\.[a-z0-9]+$/i, "");

async function getBuffer(name) {
  if (isUrl) {
    try {
      const r = await fetch(`${base}/${encodeURIComponent(name)}`);
      if (!r.ok) return null;
      return Buffer.from(await r.arrayBuffer());
    } catch { return null; }
  }
  const p = join(base, name);
  if (!existsSync(p)) return null;
  try { return readFileSync(p); } catch { return null; }
}

async function upload(bucket, path, buf, name) {
  const { error } = await s.storage.from(bucket).upload(path, buf, { contentType: ctype(name), upsert: true });
  if (error) return null;
  return s.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function runBlog() {
  if (!dumpFile) { console.error("Modo blog precisa do posts_dump.sql"); process.exit(1); }
  const rows = parseInsert(readFileSync(dumpFile, "utf8"));
  const { data: posts } = await s.from("blog_posts").select("id, slug");
  const bySlug = new Map((posts ?? []).map((p) => [p.slug, p.id]));

  let ok = 0, miss = 0, notFound = 0;
  for (const r of rows) {
    const capa = r.link_imagem_capa;
    if (!capa) continue;
    const postId = bySlug.get(stem(capa));
    if (!postId) { notFound++; continue; }
    const buf = await getBuffer(capa);
    if (!buf) { miss++; console.warn(`  ✗ não achei: ${capa}`); continue; }
    const url = await upload("blog-images", capa, buf, capa);
    if (!url) { miss++; continue; }
    await s.from("blog_posts").update({ cover_url: url }).eq("id", postId);
    ok++;
  }
  console.log(`\n✓ Capas: ${ok} · não achadas: ${miss} · post não encontrado: ${notFound}`);
}

async function runAvatar() {
  // email -> psychologist_id
  const { data: psys } = await s.from("psychologists").select("id, profile_id");
  const { data: profs } = await s.from("profiles").select("id, email");
  const emailById = new Map((profs ?? []).map((p) => [p.id, (p.email || "").toLowerCase()]));
  const byEmail = new Map();
  for (const p of psys ?? []) { const em = emailById.get(p.profile_id); if (em) byEmail.set(em, p.id); }

  // Lista de {file, email}: do dump file_uploads OU varrendo a pasta.
  let items = [];
  if (dumpFile) {
    const rows = parseInsert(readFileSync(dumpFile, "utf8"));
    items = rows
      .map((r) => String(r.name ?? ""))
      .filter((n) => /_profile_picture\./i.test(n))
      .map((n) => ({ file: n, email: n.split("_profile_picture")[0].toLowerCase() }));
  } else if (!isUrl) {
    items = readdirSync(base)
      .filter((n) => /_profile_picture\./i.test(n))
      .map((n) => ({ file: n, email: n.split("_profile_picture")[0].toLowerCase() }));
  } else {
    console.error("Modo avatar por URL precisa do file_uploads_dump.sql");
    process.exit(1);
  }

  let ok = 0, miss = 0, notFound = 0;
  for (const { file, email } of items) {
    const psyId = byEmail.get(email);
    if (!psyId) { notFound++; continue; }
    const buf = await getBuffer(file);
    if (!buf) { miss++; console.warn(`  ✗ não achei: ${file}`); continue; }
    const url = await upload("avatars", `${psyId}/${file}`, buf, file);
    if (!url) { miss++; continue; }
    await s.from("psychologists").update({ avatar_url: url }).eq("id", psyId);
    ok++;
  }
  console.log(`\n✓ Avatares: ${ok} · não achados: ${miss} · psicólogo não encontrado: ${notFound}`);
}

if (mode === "blog") await runBlog();
else if (mode === "avatar") await runAvatar();
else { console.error("modo inválido: blog|avatar"); process.exit(1); }
