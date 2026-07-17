// Cria/apaga um admin temporário para validação. Uso: node scripts/tmp-admin.mjs create|delete
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const EMAIL = "admin.teste@ayumana.com.br";
const PASS = "AyumanaAdmin!2026";

async function findByEmail(email) {
  for (let p = 1; p <= 5; p++) {
    const { data } = await s.auth.admin.listUsers({ page: p, perPage: 1000 });
    const f = data?.users?.find((u) => u.email === email);
    if (f) return f;
    if (!data || data.users.length < 1000) break;
  }
  return null;
}

const cmd = process.argv[2];
if (cmd === "create") {
  let id;
  const { data, error } = await s.auth.admin.createUser({ email: EMAIL, password: PASS, email_confirm: true, user_metadata: { full_name: "Admin Teste" } });
  if (error) { const ex = await findByEmail(EMAIL); id = ex?.id; } else id = data.user.id;
  await s.from("profiles").upsert({ id, full_name: "Admin Teste", email: EMAIL, role: "admin" });
  console.log("admin criado:", EMAIL, "/", PASS);
} else if (cmd === "delete") {
  const ex = await findByEmail(EMAIL);
  if (ex) { await s.auth.admin.deleteUser(ex.id); console.log("admin apagado"); }
  else console.log("nada para apagar");
} else console.log("use create|delete");
