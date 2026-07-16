// Conteúdo das landing pages por país (SEO programático — Blueprint §4).
// slug amigável -> conteúdo específico da dor local.

export type CountryLanding = {
  slug: string;
  code: string;
  name: string;
  demonym: string; // "no", "em", "nos"...
  headline: string;
  intro: string;
  pains: string[];
  timezoneHint: string;
};

export const COUNTRY_LANDINGS: CountryLanding[] = [
  {
    slug: "portugal",
    code: "PT",
    name: "Portugal",
    demonym: "em Portugal",
    headline: "Psicólogos brasileiros para quem vive em Portugal",
    intro:
      "Recomeçar em Portugal traz burocracia, saudade e a sensação de estar entre dois mundos. Converse com psicólogos brasileiros que entendem a sua realidade — em português do Brasil, no seu fuso.",
    pains: [
      "Adaptação e sensação de não pertencer",
      "Saudade da família e da rede de apoio",
      "Ansiedade com documentação e recomeço profissional",
      "Relacionamentos e maternidade longe de casa",
    ],
    timezoneHint: "Fuso de Lisboa (WET/WEST)",
  },
  {
    slug: "estados-unidos",
    code: "US",
    name: "Estados Unidos",
    demonym: "nos Estados Unidos",
    headline: "Psicólogos brasileiros para quem vive nos Estados Unidos",
    intro:
      "A vida nos EUA cobra ritmo, adaptação cultural e distância. Encontre psicólogos brasileiros que atendem online, respeitam seu fuso e falam a sua língua.",
    pains: [
      "Choque cultural e barreira do idioma",
      "Jornada de trabalho intensa e estresse",
      "Isolamento e distância da família",
      "Criação de filhos bilíngues",
    ],
    timezoneHint: "Fusos ET, CT, MT e PT",
  },
  {
    slug: "irlanda",
    code: "IE",
    name: "Irlanda",
    demonym: "na Irlanda",
    headline: "Psicólogos brasileiros para quem vive na Irlanda",
    intro:
      "Estudar e trabalhar na Irlanda é desafiador — clima, custo de vida e recomeço. Fale com psicólogos brasileiros que acolhem essa fase, em português.",
    pains: [
      "Adaptação de estudantes e recém-chegados",
      "Ansiedade financeira e de moradia",
      "Solidão e saudade",
      "Relacionamentos à distância",
    ],
    timezoneHint: "Fuso de Dublin (GMT/IST)",
  },
  {
    slug: "reino-unido",
    code: "GB",
    name: "Reino Unido",
    demonym: "no Reino Unido",
    headline: "Psicólogos brasileiros para quem vive no Reino Unido",
    intro:
      "Entre Londres e o interior, a vida no Reino Unido tem seu preço emocional. Encontre psicólogos brasileiros que atendem online e entendem a distância.",
    pains: [
      "Adaptação cultural e clima",
      "Estresse e ritmo de trabalho",
      "Identidade e pertencimento",
      "Saudade e maternidade longe da rede",
    ],
    timezoneHint: "Fuso de Londres (GMT/BST)",
  },
  {
    slug: "alemanha",
    code: "DE",
    name: "Alemanha",
    demonym: "na Alemanha",
    headline: "Psicólogos brasileiros para quem vive na Alemanha",
    intro:
      "A Alemanha exige adaptação a uma cultura e um idioma difíceis. Converse com psicólogos brasileiros que acolhem esse processo, em português.",
    pains: [
      "Barreira do idioma e burocracia",
      "Choque cultural e frieza percebida",
      "Isolamento e saudade",
      "Recomeço de carreira",
    ],
    timezoneHint: "Fuso de Berlim (CET/CEST)",
  },
  {
    slug: "espanha",
    code: "ES",
    name: "Espanha",
    demonym: "na Espanha",
    headline: "Psicólogos brasileiros para quem vive na Espanha",
    intro:
      "Morar na Espanha aproxima culturas, mas a saudade e o recomeço continuam. Fale com psicólogos brasileiros que entendem sua jornada.",
    pains: [
      "Adaptação e recomeço profissional",
      "Saudade e distância da família",
      "Relacionamentos e identidade",
      "Ansiedade e autoestima",
    ],
    timezoneHint: "Fuso de Madri (CET/CEST)",
  },
  {
    slug: "canada",
    code: "CA",
    name: "Canadá",
    demonym: "no Canadá",
    headline: "Psicólogos brasileiros para quem vive no Canadá",
    intro:
      "O Canadá acolhe, mas o inverno, a distância e o recomeço pesam. Encontre psicólogos brasileiros que atendem online, no seu fuso.",
    pains: [
      "Adaptação ao clima e à rotina",
      "Processo de imigração e ansiedade",
      "Solidão e saudade",
      "Criação de filhos bilíngues",
    ],
    timezoneHint: "Fusos ET, CT, MT e PT",
  },
  {
    slug: "australia",
    code: "AU",
    name: "Austrália",
    demonym: "na Austrália",
    headline: "Psicólogos brasileiros para quem vive na Austrália",
    intro:
      "Do outro lado do mundo, o fuso e a distância desafiam. Converse com psicólogos brasileiros que atendem em horários compatíveis com a Austrália.",
    pains: [
      "Distância extrema da família",
      "Adaptação de estudantes e trabalhadores",
      "Solidão e saudade",
      "Relacionamentos à distância",
    ],
    timezoneHint: "Fusos AEST/AWST",
  },
  {
    slug: "japao",
    code: "JP",
    name: "Japão",
    demonym: "no Japão",
    headline: "Psicólogos brasileiros para quem vive no Japão",
    intro:
      "A comunidade brasileira no Japão enfrenta jornada dura, idioma e distância. Fale com psicólogos brasileiros que acolhem essa realidade, em português.",
    pains: [
      "Jornada de trabalho intensa (dekassegui)",
      "Barreira do idioma e cultura",
      "Isolamento e saudade",
      "Identidade e filhos entre duas culturas",
    ],
    timezoneHint: "Fuso de Tóquio (JST)",
  },
  {
    slug: "holanda",
    code: "NL",
    name: "Holanda",
    demonym: "na Holanda",
    headline: "Psicólogos brasileiros para quem vive na Holanda",
    intro:
      "Morar na Holanda mistura liberdade e desafios de adaptação. Encontre psicólogos brasileiros que entendem sua fase, em português.",
    pains: [
      "Adaptação cultural e idioma",
      "Recomeço e carreira",
      "Saudade e distância",
      "Relacionamentos e identidade",
    ],
    timezoneHint: "Fuso de Amsterdã (CET/CEST)",
  },
];

export function getCountryLanding(slug: string): CountryLanding | undefined {
  return COUNTRY_LANDINGS.find((c) => c.slug === slug);
}
