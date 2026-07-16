// Confere as contagens das tabelas no Supabase. Uso: npm run db:check
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function c(t, f) {
  let q = s.from(t).select("*", { count: "exact", head: true });
  if (f) q = f(q);
  const { count, error } = await q;
  return error ? `ERRO(${error.message})` : count;
}

const out = {};
out["blog_posts (total)"] = await c("blog_posts");
out["blog_posts (publicados)"] = await c("blog_posts", (q) => q.eq("published", true));
out["psychologists (total)"] = await c("psychologists");
out["psychologists (publicados)"] = await c("psychologists", (q) => q.eq("is_published", true));
out["psychologists (verificados)"] = await c("psychologists", (q) => q.eq("verification_status", "aprovado"));
out["psychologist_approaches"] = await c("psychologist_approaches");
out["profiles"] = await c("profiles");
out["plans"] = await c("plans");
out["approaches"] = await c("approaches");
out["specialties"] = await c("specialties");
out["forum_questions"] = await c("forum_questions");
out["forum_answers"] = await c("forum_answers");
out["payment_events"] = await c("payment_events");
console.log(JSON.stringify(out, null, 2));
