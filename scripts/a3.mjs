import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const q = async (label, p) => { const r = await p; console.log(label, r.error ? "ERRO: "+r.error.message : (r.count !== null && r.count !== undefined ? r.count : JSON.stringify(r.data))); };

await q("forum pendentes:", s.from("forum_questions").select("id",{count:"exact",head:true}).eq("status","pendente"));
await q("forum publicadas:", s.from("forum_questions").select("id",{count:"exact",head:true}).eq("status","publicada"));
await q("respostas forum:", s.from("forum_answers").select("id",{count:"exact",head:true}));
await q("Amanda:", s.from("psychologists").select("display_name,headline,bio").eq("slug","amanda-santos-0f56ee").maybeSingle());
await q("Pamella:", s.from("psychologists").select("display_name,plan_tier,verification_status,crp_number,verified_at").ilike("display_name","PAMELLA%").maybeSingle());
await q("CRP aprovados:", s.from("psychologists").select("id",{count:"exact",head:true}).eq("verification_status","aprovado"));
await q("com doc CRP enviado:", s.from("psychologists").select("id",{count:"exact",head:true}).not("crp_document_path","is",null));
await q("verificacao pendente:", s.from("psychologists").select("id",{count:"exact",head:true}).eq("verification_status","pendente"));
