// Semeia o fórum com perguntas reais (publicadas), várias com resposta de
// psicólogos publicados. Idempotente (upsert por slug). Uso: npm run db:seed:forum
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const now = new Date().toISOString();

const slug = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);

// pergunta: [titulo, corpo, alias, pais(codigo|null), especialidade(slug|null), resposta(texto|null)]
const Q = [
  ["Como lidar com a saudade da família morando fora?", "Faz 2 anos que moro em Portugal e a saudade aperta demais em datas especiais. O que fazer?", "Anônimo", "PT", "saudade",
    "Saudade é sinal de vínculo, não de fraqueza. Ajuda muito criar **rituais de conexão** (uma chamada fixa por semana, cozinhar algo de casa) e, ao mesmo tempo, construir novos laços aí. Se a dor virar bloqueio nas datas difíceis, um acompanhamento ajuda a atravessá-las com mais leveza."],
  ["Ansiedade antes de começar a trabalhar em outro idioma", "Vou começar num emprego onde vou falar inglês o dia todo e sinto um frio na barriga constante.", "João", "IE", "ansiedade",
    "É totalmente normal — seu corpo está se preparando para um desafio real. Foque no que está sob seu controle (preparo, sono) e lembre que ninguém espera perfeição no idioma nos primeiros meses. Técnicas de respiração ajudam no momento agudo."],
  ["Meu filho não quer mais falar português. E agora?", "Ele tem 7 anos, nascido fora, e passou a responder só no idioma local.", "Mãe coruja", "US", "filhos-bilingues",
    "Isso é comum e não significa rejeição às raízes. Mantenha o português como **língua do afeto** (histórias, música, brincadeiras), sem transformar em obrigação. Aos poucos ele associa o idioma a momentos bons. Comunidades de brasileiros ajudam muito."],
  ["Como saber se preciso de terapia ou só estou passando por uma fase?", "Ando desanimado há semanas, mas não sei se é algo sério.", "Anônimo", null, "depressao",
    "Uma boa régua é o impacto no seu dia a dia: se o desânimo atrapalha sono, trabalho ou relações por mais de duas semanas, vale conversar com um profissional. Terapia não é só para crises — também serve para se conhecer e prevenir."],
  ["Relacionamento à distância está me esgotando", "Meu parceiro ficou no Brasil e a diferença de fuso torna tudo difícil.", "Anônimo", "AU", "relacionamento-distancia",
    "Relacionamento à distância cobra combinados claros: expectativas sobre frequência de contato, planos concretos de reencontro e espaço para a vida de cada um. O fuso é um desafio real — vale negociar janelas fixas em vez de tentar estar sempre disponível."],
  ["Sinto que não pertenço a lugar nenhum", "No exterior sou 'a brasileira', no Brasil já me sinto meio estrangeira. Isso tem nome?", "Anônimo", "DE", "identidade",
    "Esse sentimento é conhecido e muito comum entre imigrantes — a sensação de estar 'entre dois mundos'. Não é sinal de que algo está errado com você; é parte de construir uma identidade mais ampla. A terapia ajuda a ressignificar isso como pertencer aos dois lugares, e não a nenhum."],
  ["Como controlar crises de pânico?", "Do nada meu coração dispara, falta ar e acho que vou morrer.", "Anônimo", null, "panico",
    "Crises de pânico são assustadoras, mas não são perigosas em si — o corpo entra em alarme sem ameaça real. No momento, ajuda respirar devagar (expiração mais longa que a inspiração) e lembrar que passa em minutos. A TCC tem ótimos resultados; procure um profissional."],
  ["Maternidade longe da rede de apoio", "Tive bebê fora do Brasil, sem mãe, sem amigas por perto. Estou exausta.", "Anônimo", "GB", "maternidade-exterior",
    "Maternar sem rede é sobrecarga real, não frescura. Buscar grupos de mães (brasileiras ou locais), dividir tarefas com o parceiro e pedir ajuda profissional não é fraqueza — é cuidado. Fique atenta a sinais de depressão pós-parto e não hesite em procurar apoio."],
  ["Vale a pena fazer terapia online?", "Nunca fiz e tenho receio de não funcionar por vídeo.", "Anônimo", null, null,
    "A terapia online tem eficácia comparável à presencial para a maioria das demandas, com a vantagem da flexibilidade — essencial para quem vive fora. O vínculo com o profissional se constrói do mesmo jeito. Vale experimentar algumas sessões antes de julgar."],
  ["Como lidar com o choque cultural nos primeiros meses?", "Cheguei há pouco e tudo me irrita: o jeito das pessoas, a comida, a burocracia.", "Anônimo", "NL", "adaptacao-cultural",
    "O que você descreve é a fase de 'irritação' do choque cultural — depois da empolgação inicial e antes da adaptação. É previsível e passa. Ajuda ter expectativas realistas para os primeiros 6-12 meses e não se cobrar por 'não estar amando tudo'."],
  ["Baixa autoestima depois de recomeçar do zero fora", "Aqui minha profissão não vale, recomecei em subempregos e me sinto um fracasso.", "Anônimo", "CA", "autoestima",
    "Recomeçar não apaga quem você é nem o que construiu. A revalidação de carreira no exterior é um processo, não um veredito sobre seu valor. Separar autoestima de status profissional é um trabalho importante — e possível — na terapia."],
  ["Estou com insônia desde que mudei de país", "Não consigo dormir direito há meses.", "Anônimo", "JP", "estresse",
    "Mudança de país mexe com sono por vários motivos: fuso, estresse, preocupações. Ajuda cuidar da higiene do sono (horários regulares, menos telas à noite, luz natural de dia). Se persistir, vale investigar ansiedade por trás — a terapia ajuda."],
  ["Como falar de saúde mental com família que não entende?", "Meus pais acham que terapia é 'coisa de louco'.", "Anônimo", null, null,
    "Você não precisa convencer todo mundo para cuidar de si. Com a família, às vezes funciona falar do concreto ('quero me sentir melhor') em vez do rótulo 'terapia'. Mas a decisão de se cuidar é sua, independentemente da aprovação deles."],
  ["Luto à distância: não consegui me despedir", "Perdi minha avó no Brasil e não pude ir ao enterro.", "Anônimo", "US", "luto",
    "Sinto muito pela sua perda. O luto à distância tem uma dor extra: a de não ter podido estar presente. Criar seus próprios rituais de despedida (uma carta, acender uma vela, um momento de lembrança) ajuda a elaborar. Não precisa passar por isso sozinho."],
  ["Trabalho remoto para o Brasil e não desligo nunca", "Moro fora mas trabalho no fuso do Brasil e sinto que nunca paro.", "Anônimo", "PT", "estresse",
    "Trabalhar em outro fuso borra os limites entre trabalho e descanso. Definir horários de início/fim, avisar a equipe da sua janela e proteger o tempo de vida pessoal é essencial para não chegar ao esgotamento. Vale rever isso com cuidado."],
  ["Como recomeçar amizades em um país novo?", "Me sinto muito sozinho, não conheço ninguém aqui.", "Anônimo", "IE", "solidao-exterior",
    "Solidão no início é quase regra, não exceção. Amizades novas levam tempo e repetição — grupos de interesse, comunidades brasileiras, atividades regulares ajudam a criar vínculo. Seja gentil consigo: você está construindo uma vida do zero."],
  ["Meu relacionamento mudou depois que imigramos juntos", "Brigamos muito mais desde que mudamos de país.", "Anônimo", "DE", "relacionamentos",
    "A imigração é um teste de estresse para casais: tudo é novo e o apoio externo some. Muitas vezes um se adapta mais rápido que o outro, gerando atrito. Terapia de casal ajuda a alinhar expectativas e recuperar a parceria nessa fase."],
  ["Como ajudar meu filho adolescente a se adaptar?", "Ele está fechado, sem amigos, com saudade do Brasil.", "Mãe", "GB", "adaptacao-cultural",
    "Adolescentes sentem a mudança de forma intensa porque a identidade e o grupo são centrais nessa fase. Validar a saudade (sem minimizar), manter vínculos com o Brasil e dar tempo ajuda. Se o isolamento persistir, apoio psicológico faz diferença."],
  ["Ansiedade financeira morando fora", "Vivo com medo constante de não dar conta das contas em outra moeda.", "Anônimo", "GB", "ansiedade",
    "Medo financeiro real merece um plano concreto (orçamento, reserva) — e também um olhar para a ansiedade que se alimenta do 'e se'. Separar o que é problema prático do que é catastrofização ajuda a agir sem paralisar. A terapia trabalha os dois."],
  ["Vale a pena voltar para o Brasil? Estou em dúvida", "Não sei se fico ou volto, e isso me consome.", "Anônimo", null, null,
    "Essa dúvida é pesada porque não tem resposta 'certa' — envolve valores, perdas e ganhos dos dois lados. Terapia não decide por você, mas ajuda a clarear o que realmente importa para você, reduzindo a angústia da indecisão."],
  ["Como manter a cultura brasileira com filhos nascidos fora?", "Quero que meus filhos tenham orgulho das raízes.", "Anônimo", "US", "filhos-bilingues",
    "Cultura se transmite pelo cotidiano afetivo: comida, música, histórias de família, festas, o idioma como brincadeira. Quanto mais associada a momentos bons (e menos a obrigação), mais natural o pertencimento. Comunidades brasileiras reforçam isso."],
  ["Me sinto culpada por ter deixado meus pais idosos no Brasil", "A culpa de estar longe deles me persegue.", "Anônimo", "CA", "saudade",
    "Culpa de imigrante é um tema recorrente e pesado. Cuidar à distância é possível (presença por chamada, apoio combinado com quem está perto) e não anula seu direito de construir sua vida. Trabalhar essa culpa na terapia alivia bastante."],
  ["Como saber se é burnout ou só cansaço?", "Estou exausto o tempo todo, sem vontade de nada.", "Anônimo", null, "estresse",
    "Cansaço melhora com descanso; burnout, não — ele vem com exaustão persistente, distanciamento do trabalho e sensação de ineficácia. Se o descanso não repõe suas energias há semanas, vale investigar com um profissional antes de agravar."],
  ["Terapia em português faz diferença mesmo?", "Falo o idioma local, será que preciso de terapeuta brasileiro?", "Anônimo", null, null,
    "Fazer terapia na língua materna permite acessar emoções e nuances que se perdem num segundo idioma. Além disso, um psicólogo brasileiro entende o contexto da imigração sem você precisar explicar tudo. Para muita gente, faz enorme diferença."],
  ["Como lidar com preconceito ou xenofobia no exterior?", "Já ouvi comentários por ser imigrante e isso me abalou.", "Anônimo", "DE", "identidade",
    "Sofrer preconceito dói e não é 'implicância sua'. Nomear o que aconteceu, buscar redes de apoio e não internalizar a mensagem de que você 'vale menos' são passos importantes. A terapia ajuda a proteger sua autoestima e a lidar com essas situações."],
];

async function run() {
  // Psicólogos publicados para autorar respostas (rotação).
  const { data: psys } = await s.from("psychologists").select("id").eq("is_published", true).limit(30);
  const authors = (psys ?? []).map((p) => p.id);
  if (!authors.length) console.warn("Aviso: nenhum psicólogo publicado para autorar respostas.");

  // Especialidades slug -> id
  const { data: specs } = await s.from("specialties").select("id, slug");
  const specId = Object.fromEntries((specs ?? []).map((r) => [r.slug, r.id]));

  let ok = 0, ans = 0, ai = 0;
  for (const [title, body, alias, country, spec, answer] of Q) {
    const { data: q, error } = await s.from("forum_questions").upsert({
      slug: slug(title),
      title, body, author_alias: alias,
      country_code: country,
      specialty_id: spec ? specId[spec] ?? null : null,
      status: "publicada", published_at: now,
    }, { onConflict: "slug" }).select("id").single();
    if (error) { console.error(`✗ ${title}: ${error.message}`); continue; }
    ok++;

    if (answer && authors.length) {
      const psyId = authors[ai % authors.length]; ai++;
      const { data: exists } = await s.from("forum_answers").select("id").eq("question_id", q.id).limit(1).maybeSingle();
      if (!exists) {
        const { error: aerr } = await s.from("forum_answers").insert({
          question_id: q.id, psychologist_id: psyId, body: answer,
          status: "publicada", published_at: now,
        });
        if (!aerr) ans++;
      }
    }
  }
  console.log(`✓ Perguntas: ${ok} · Respostas: ${ans}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
