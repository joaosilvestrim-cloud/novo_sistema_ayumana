import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
console.log("URL:", url);
const s = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const c1 = await s.from("psychologists").select("id", { count: "exact", head: true });
console.log("total psicologos:", c1.count, "erro:", c1.error?.message ?? "-");

const c2 = await s.from("psychologists").select("id", { count: "exact", head: true }).eq("is_published", true);
console.log("publicados:", c2.count, "erro:", c2.error?.message ?? "-");

const ana = await s.from("psychologists").select("id,display_name,plan_tier,is_published,verification_status").eq("slug","dra-ana-exemplo-616c37").maybeSingle();
console.log("Ana:", JSON.stringify(ana.data), "erro:", ana.error?.message ?? "-");

const pagos = await s.from("psychologists").select("display_name,plan_tier").neq("plan_tier","essencial");
console.log("pagos rows:", pagos.data?.length, "erro:", pagos.error?.message ?? "-", JSON.stringify(pagos.data?.slice(0,5)));

const q = await s.from("forum_questions").select("status", { count: "exact", head: true });
console.log("forum total:", q.count, "erro:", q.error?.message ?? "-");
