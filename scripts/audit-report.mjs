import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

console.log("=== 1) CONTAS SUSPEITAS DE TESTE ===");
const { data: profs } = await s.from("profiles").select("id, full_name, email, role");
const { data: psys } = await s.from("psychologists").select("id, profile_id, display_name, slug, is_published, verification_status, plan_tier, crp_number, bio, headline");
const byProf = new Map((psys??[]).map(p=>[p.profile_id,p]));
const suspects = (profs??[]).filter(p => /teste|test|exemplo|estudio/i.test(`${p.full_name} ${p.email}`) || /julianxpereirx/i.test(p.email??""));
for (const p of suspects) {
  const y = byProf.get(p.id);
  console.log(`- ${p.full_name} <${p.email}> role=${p.role} | publicado=${y?.is_published ?? "-"} verif=${y?.verification_status ?? "-"} plano=${y?.plan_tier ?? "-"} crp=${y?.crp_number ?? "-"}`);
}

console.log("\n=== 2) FORUM: pendentes x publicadas ===");
const { data: qs } = await s.from("forum_questions").select("id,title,status");
const pend = (qs??[]).filter(q=>q.status==="pendente");
const pub = (qs??[]).filter(q=>q.status==="publicada");
console.log(`pendentes=${pend.length} publicadas=${pub.length}`);
const norm = t => (t||"").toLowerCase().replace(/[^a-z0-9à-ú ]/gi,"").trim();
let dup=0;
for (const q of pend) { const hit = pub.find(p => norm(p.title).includes(norm(q.title).slice(0,35)) || norm(q.title).includes(norm(p.title).slice(0,35))); if (hit) { dup++; console.log(`  DUP: "${q.title}"  ~=  "${hit.title}"`); } else console.log(`  NOVA: "${q.title}"`); }
console.log(`-> ${dup}/${pend.length} parecem duplicadas`);

console.log("\n=== 3) PLANOS PAGOS (sem Asaas) ===");
for (const y of (psys??[]).filter(p=>p.plan_tier!=="essencial")) {
  console.log(`- ${y.display_name} | plano=${y.plan_tier} verif=${y.verification_status} publicado=${y.is_published}`);
}

console.log("\n=== 4) BIOS/HEADLINES TRUNCADAS (dados) ===");
const trunc = (psys??[]).filter(y => (y.bio && y.bio.length>0 && y.bio.length<60 && !/[.!?]$/.test(y.bio.trim())) || (y.headline && y.headline.length>0 && y.headline.length<40 && !/[.!?]$/.test(y.headline.trim())));
console.log(`suspeitas: ${trunc.length}`);
trunc.slice(0,12).forEach(y=>console.log(`- ${y.display_name}: bio="${(y.bio||"").slice(0,50)}" | headline="${(y.headline||"").slice(0,50)}"`));
const amanda = (psys??[]).find(y=>/amanda/i.test(y.display_name||""));
if (amanda) console.log(`AMANDA -> bio(${(amanda.bio||"").length}ch)="${(amanda.bio||"").slice(0,80)}" headline="${amanda.headline}"`);

console.log("\n=== 5) BLOG: slugs dos redirects existem? ===");
const { data: posts } = await s.from("blog_posts").select("slug, title, published");
const slugs = new Set((posts??[]).map(p=>p.slug));
console.log(`total posts=${posts?.length ?? 0} (publicados=${(posts??[]).filter(p=>p.published).length})`);
const sources = ["tendencias-para-2024-em-saude-e-bem-estar","feliz-ano-novo-ja-escreveu-suas-resolucoes-para-2024","mensagem-aos-brasileiros-para-2024","saude-mental-aos-olhos-de-um-engenheiro-em-2023","sugestoes-de-presentes-para-as-maes","futurismo-pessoal","o-planejamento-foi-feito-para-nao-ser-seguido","profissionais-autonomos-e-suas-batalhas-financeiras","o-futuro-das-mulheres","comecar-e-dificil","a-jornada-da-adaptacao-cultural","como-a-adaptacao-ocorre-em-nossa-mente","navegando-pelas-ondas-da-adaptacao-e-sentido-da-vida","quando-voce-e-o-olho-do-furacao","o-abraco-da-psicologia","porque-voce-deveria-comecar-a-praticar-mindfulness-hoje-mesmo","desvendando-a-ansiedade-o-desafio-da-saude-mental-no-brasileiro"];
const dests = ["um-panorama-sobre-a-saude-mental-das-brasileiras","os-estagios-da-imigracao-da-felicidade-as-dificuldades","burnout-a-exaustao-mental-e-emocional-em-tempos-modernos","apoio-psicologico-em-tempos-de-crise-o-papel-da-psicoterapia-nas-situacoes-traumaticas","o-que-e-mindfulness-e-quais-seus-beneficios-para-a-saude-mental","ansiedade","natal-pelo-mundo-conexoes-afetivas-alem-das-fronteiras"];
console.log("ORIGENS que NÃO existem (redirect inútil):", sources.filter(x=>!slugs.has(x)).join(", ") || "nenhuma");
console.log("DESTINOS que NÃO existem (redirect -> 404!):", dests.filter(x=>!slugs.has(x)).join(", ") || "nenhum");

console.log("\n=== 6) CRP: verificados ===");
const aprov = (psys??[]).filter(y=>y.verification_status==="aprovado");
console.log(`aprovados=${aprov.length} | com verified_at? checando amostra...`);
const { data: vs } = await s.from("psychologists").select("display_name, verified_at, verified_by, crp_document_path").eq("verification_status","aprovado").limit(5);
vs?.forEach(v=>console.log(`- ${v.display_name}: verified_at=${v.verified_at} verified_by=${v.verified_by} doc=${v.crp_document_path ? "sim":"NÃO"}`));
