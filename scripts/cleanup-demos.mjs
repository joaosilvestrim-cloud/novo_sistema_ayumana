// Remove os perfis de exemplo (.demo@ayumana.com.br) e limpa o selo de
// "atende no exterior" que foi deduzido na importação (deixa para o
// psicólogo preencher). Uso: npm run db:cleanup:demos
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// 1) apaga usuários de exemplo -> cascata remove perfil/psicólogo/joins
let deleted = 0;
for (let page = 1; page <= 6; page++) {
  const { data } = await s.auth.admin.listUsers({ page, perPage: 1000 });
  const demos = (data?.users || []).filter((u) => (u.email || "").endsWith(".demo@ayumana.com.br"));
  for (const u of demos) {
    await s.auth.admin.deleteUser(u.id);
    deleted++;
    console.log("apagado:", u.email);
  }
  if (!data || data.users.length < 1000) break;
}
console.log("total apagados:", deleted);

// 2) zera o selo de exterior deduzido
const { error: e1 } = await s.from("psychologists").update({ attends_abroad: false }).not("id", "is", null);
console.log("attends_abroad zerado:", e1 ? e1.message : "ok");

// 3) limpa países atendidos (só restavam dos exemplos)
const { error: e2 } = await s.from("psychologist_countries").delete().not("psychologist_id", "is", null);
console.log("psychologist_countries limpo:", e2 ? e2.message : "ok");

// contagens finais
const c = async (f) => { let q = s.from("psychologists").select("*", { count: "exact", head: true }); if (f) q = f(q); const { count } = await q; return count; };
console.log("psicologos total:", await c());
console.log("publicados:", await c((x) => x.eq("is_published", true)));
console.log("attends_abroad=true:", await c((x) => x.eq("attends_abroad", true)));
