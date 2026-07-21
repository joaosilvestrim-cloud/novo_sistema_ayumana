import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: posts, error } = await s.from("blog_posts").select("slug, published");
if (error) { console.error(error.message); process.exit(1); }
const slugs = new Set((posts??[]).map(p=>p.slug));
console.log(`posts=${posts.length} publicados=${posts.filter(p=>p.published).length}`);
const sources = ["tendencias-para-2024-em-saude-e-bem-estar","feliz-ano-novo-ja-escreveu-suas-resolucoes-para-2024","mensagem-aos-brasileiros-para-2024","saude-mental-aos-olhos-de-um-engenheiro-em-2023","sugestoes-de-presentes-para-as-maes","futurismo-pessoal","o-planejamento-foi-feito-para-nao-ser-seguido","profissionais-autonomos-e-suas-batalhas-financeiras","o-futuro-das-mulheres","comecar-e-dificil","a-jornada-da-adaptacao-cultural","como-a-adaptacao-ocorre-em-nossa-mente","navegando-pelas-ondas-da-adaptacao-e-sentido-da-vida","quando-voce-e-o-olho-do-furacao","o-abraco-da-psicologia","porque-voce-deveria-comecar-a-praticar-mindfulness-hoje-mesmo","desvendando-a-ansiedade-o-desafio-da-saude-mental-no-brasileiro"];
const dests = ["um-panorama-sobre-a-saude-mental-das-brasileiras","os-estagios-da-imigracao-da-felicidade-as-dificuldades","burnout-a-exaustao-mental-e-emocional-em-tempos-modernos","apoio-psicologico-em-tempos-de-crise-o-papel-da-psicoterapia-nas-situacoes-traumaticas","o-que-e-mindfulness-e-quais-seus-beneficios-para-a-saude-mental","ansiedade","natal-pelo-mundo-conexoes-afetivas-alem-das-fronteiras"];
console.log("\nORIGENS inexistentes:", sources.filter(x=>!slugs.has(x)).join("\n  ") || "nenhuma");
console.log("\nDESTINOS inexistentes (301 -> 404!):", dests.filter(x=>!slugs.has(x)).join("\n  ") || "nenhum");
