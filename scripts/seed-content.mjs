// Popula blog e fórum com conteúdo de exemplo (publicado).
// Requer a migration 0003 aplicada. Usa service_role.
// Uso: npm run db:seed:content
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const now = new Date().toISOString();

const POSTS = [
  {
    slug: "saudade-morando-fora",
    title: "Saudade de casa: por que dói tanto morar longe",
    excerpt:
      "A saudade não é fraqueza — é vínculo. Entenda o que acontece e como cuidar disso vivendo no exterior.",
    category: "exterior",
    content:
      "## A saudade tem função\n\nMorar fora realiza sonhos, mas também ativa uma dor específica: a **saudade**. Ela aparece em datas, cheiros, sotaques.\n\n## O que ajuda\n\n- Manter rituais brasileiros (comida, música, chamadas de vídeo)\n- Construir uma nova rede de apoio local\n- Falar com um psicólogo **em português**, que entende o contexto\n\n> Sentir saudade não significa que você escolheu errado. Significa que você ama o que deixou.\n\nSe a saudade está pesando demais, procure ajuda. Terapia em português pode encurtar esse caminho.",
  },
  {
    slug: "ansiedade-adaptacao-novo-pais",
    title: "Ansiedade e adaptação: os primeiros meses em um novo país",
    excerpt:
      "Documentos, idioma, trabalho, cultura. Como atravessar a fase mais intensa da mudança sem se perder.",
    category: "exterior",
    content:
      "## Tudo ao mesmo tempo\n\nOs primeiros meses fora concentram decisões e incertezas. É natural que a **ansiedade** aumente.\n\n## Estratégias práticas\n\n1. Divida o gigante em tarefas pequenas\n2. Combine expectativas realistas para os primeiros 6 meses\n3. Cuide do sono e do corpo — eles seguram a mente\n\nUm acompanhamento psicológico ajuda a organizar esse período e a reduzir a autocobrança.",
  },
  {
    slug: "filhos-bilingues-identidade",
    title: "Filhos bilíngues: criando identidade entre duas culturas",
    excerpt:
      "Como apoiar crianças que crescem entre o português e a língua do país onde vivem.",
    category: "familia",
    content:
      "## Duas línguas, uma identidade\n\nCriar filhos bilíngues é um presente — e um desafio. As crianças transitam entre culturas e às vezes se sentem divididas.\n\n## Dicas\n\n- Valorize o português como língua do afeto\n- Não corrija a mistura de línguas com dureza\n- Busque comunidades e histórias que representem as duas culturas\n\nPsicólogos especializados em infância no exterior podem apoiar essa construção.",
  },
];

const QUESTIONS = [
  {
    slug: "como-lidar-saudade-familia",
    title: "Como lidar com a saudade da família morando fora?",
    body: "Faz 2 anos que moro em Portugal e a saudade da minha mãe aperta demais em datas especiais. O que posso fazer?",
    author_alias: "Anônimo",
    country_code: "PT",
    specialty_slug: "saudade",
    answers: [
      {
        psy: "Mariana Alves",
        body: "Saudade é sinal de vínculo, não de fraqueza. Ajuda muito criar **rituais de conexão** (uma chamada fixa por semana, cozinhar algo da sua mãe) e, ao mesmo tempo, construir novos vínculos aí. Se a dor virar bloqueio, vale um acompanhamento para atravessar as datas difíceis com mais leveza.",
      },
    ],
  },
  {
    slug: "ansiedade-primeiro-emprego-exterior",
    title: "Ansiedade antes do primeiro emprego no exterior — é normal?",
    body: "Vou começar a trabalhar em outro idioma e sinto um frio na barriga que não passa.",
    author_alias: "João",
    country_code: "IE",
    specialty_slug: "ansiedade",
    answers: [
      {
        psy: "Camila Nunes",
        body: "Totalmente normal — seu corpo está se preparando para um desafio real. Foque no que está sob seu controle: preparar-se, dormir bem e lembrar que ninguém espera perfeição no idioma nos primeiros meses. Técnicas de respiração ajudam no momento agudo.",
      },
    ],
  },
  {
    slug: "filho-nao-quer-falar-portugues",
    title: "Meu filho não quer mais falar português. E agora?",
    body: "Ele tem 7 anos, nascido fora, e passou a responder só no idioma local.",
    author_alias: "Mãe coruja",
    country_code: "US",
    specialty_slug: "filhos-bilingues",
    answers: [],
  },
];

async function run() {
  // Blog
  for (const p of POSTS) {
    const { error } = await supabase.from("blog_posts").upsert(
      { ...p, published: true, published_at: now, author_name: "Equipe Ayumana" },
      { onConflict: "slug" }
    );
    console.log(error ? `✗ post ${p.slug}: ${error.message}` : `✓ post ${p.slug}`);
  }

  // Mapas auxiliares
  const { data: specs } = await supabase.from("specialties").select("id, slug");
  const specMap = Object.fromEntries((specs ?? []).map((s) => [s.slug, s.id]));
  const { data: psys } = await supabase
    .from("psychologists")
    .select("id, display_name");
  const psyMap = Object.fromEntries((psys ?? []).map((p) => [p.display_name, p.id]));

  // Fórum
  for (const q of QUESTIONS) {
    const { data: qRow, error: qErr } = await supabase
      .from("forum_questions")
      .upsert(
        {
          slug: q.slug,
          title: q.title,
          body: q.body,
          author_alias: q.author_alias,
          country_code: q.country_code,
          specialty_id: specMap[q.specialty_slug] ?? null,
          status: "publicada",
          published_at: now,
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (qErr) {
      console.log(`✗ pergunta ${q.slug}: ${qErr.message}`);
      continue;
    }
    console.log(`✓ pergunta ${q.slug}`);

    for (const ans of q.answers) {
      const psyId = psyMap[ans.psy];
      if (!psyId) continue;
      // Evita duplicar respostas em re-runs.
      const { data: exists } = await supabase
        .from("forum_answers")
        .select("id")
        .eq("question_id", qRow.id)
        .eq("psychologist_id", psyId)
        .maybeSingle();
      if (exists) continue;
      await supabase.from("forum_answers").insert({
        question_id: qRow.id,
        psychologist_id: psyId,
        body: ans.body,
        status: "publicada",
        published_at: now,
      });
      console.log(`  ↳ resposta de ${ans.psy}`);
    }
  }

  console.log("\n✓ Seed de conteúdo concluído.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
