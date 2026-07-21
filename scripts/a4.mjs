import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const r = await s.from("psychologists").select("display_name,slug,headline,bio").ilike("display_name","%amanda%").limit(3);
if (r.error) console.log("ERRO", r.error.message);
(r.data??[]).forEach(y=>console.log(`- ${y.display_name} (${y.slug})\n  headline(${(y.headline||"").length}ch): ${JSON.stringify(y.headline)}\n  bio(${(y.bio||"").length}ch): ${JSON.stringify((y.bio||"").slice(0,140))}`));
