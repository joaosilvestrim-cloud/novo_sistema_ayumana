// Campanha de reativação: envia e-mail "assuma seu perfil" com link para
// definir senha, via Resend. Usa Supabase generateLink (recovery).
//
//   node scripts/send-claim-emails.mjs --test=voce@email.com   (envia 1 teste)
//   node scripts/send-claim-emails.mjs                         (só simula, mostra quantos)
//   node scripts/send-claim-emails.mjs --confirm --limit=50    (envia de verdade, até 50)
//   flags: --confirm (envia), --limit=N, --all (inclui não publicados)
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const args = process.argv.slice(2);
const getArg = (name) => { const a = args.find((x) => x.startsWith(`--${name}=`)); return a ? a.split("=")[1] : null; };
const has = (name) => args.includes(`--${name}`);

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";
const FROM = process.env.EMAIL_FROM || "Ayumana <contato@ayumana.com.br>";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const resend = new Resend(process.env.RESEND_API_KEY);

function emailHtml(nome, link) {
  const petroleo = "#05474A", verde = "#73A533";
  return `<div style="background:#f7faf9;font-family:Arial,sans-serif;color:#1e2b2a;padding:24px;">
    <div style="max-width:560px;margin:0 auto;">
      <div style="background:${petroleo};border-radius:16px 16px 0 0;padding:22px 26px;color:#fff;font-size:22px;font-weight:700;">
        <span style="display:inline-block;width:12px;height:12px;background:${verde};border-radius:999px;margin-right:8px;"></span>ayumana
      </div>
      <div style="background:#fff;border:1px solid #dde5e3;border-top:none;border-radius:0 0 16px 16px;padding:28px;">
        <h1 style="margin:0 0 12px;font-size:22px;color:${petroleo};">Olá${nome ? `, ${nome}` : ""}!</h1>
        <p style="font-size:15px;line-height:1.6;color:#3a4645;">A Ayumana é a nova plataforma que conecta psicólogos brasileiros a pacientes no Brasil e no exterior. Já preparamos o seu perfil. Clique abaixo para definir sua senha e assumir o acesso.</p>
        <div style="margin:24px 0 6px;">
          <a href="${link}" style="display:inline-block;background:${verde};color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">Assumir meu perfil</a>
        </div>
        <p style="font-size:13px;color:#96a5a2;">O link é pessoal e expira em breve.</p>
      </div>
    </div>
  </div>`;
}

async function targets() {
  const test = getArg("test");
  const { data: profs } = await s.from("profiles").select("id, email, full_name");
  const emailById = new Map((profs ?? []).map((p) => [p.id, p]));
  let q = s.from("psychologists").select("profile_id, is_published");
  if (!has("all")) q = q.eq("is_published", true);
  const { data: psys } = await q;
  let list = (psys ?? [])
    .map((p) => emailById.get(p.profile_id))
    .filter((p) => p && p.email && p.email.includes("@"));
  if (test) list = list.filter((p) => p.email.toLowerCase() === test.toLowerCase());
  const limit = Number(getArg("limit"));
  if (limit) list = list.slice(0, limit);
  return list;
}

async function run() {
  const list = await targets();
  const confirm = has("confirm") || !!getArg("test");
  console.log(`Alvos: ${list.length}`);
  if (!confirm) {
    console.log("Modo simulação (sem envio). Use --test=email para 1 teste, ou --confirm para enviar de verdade.");
    return;
  }
  if (!process.env.RESEND_API_KEY) { console.error("Falta RESEND_API_KEY."); process.exit(1); }

  let ok = 0, fail = 0;
  for (const p of list) {
    try {
      const { data } = await s.auth.admin.generateLink({
        type: "recovery",
        email: p.email,
        options: { redirectTo: `${SITE}/redefinir-senha` },
      });
      const link = data?.properties?.action_link;
      if (!link) { fail++; continue; }
      const nome = (p.full_name || "").split(" ")[0];
      const { error } = await resend.emails.send({
        from: FROM, to: p.email,
        subject: "Seu perfil na Ayumana está pronto — assuma o acesso",
        html: emailHtml(nome, link),
      });
      if (error) { console.error(`✗ ${p.email}: ${error.message}`); fail++; }
      else { ok++; }
      await new Promise((r) => setTimeout(r, 600)); // respeita limite do Resend
    } catch (e) {
      console.error(`✗ ${p.email}: ${e.message}`); fail++;
    }
  }
  console.log(`✓ enviados: ${ok} · falhas: ${fail}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
