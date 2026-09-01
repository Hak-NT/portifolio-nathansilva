/* ------------------------------------------------------------------ */
/* Content model — single source of truth (ported 1:1 from data.ts)    */
/* ------------------------------------------------------------------ */

// Real software marks — uploaded assets, transparent PNGs (Canva is a JPG).
// Place the original files (with these exact names) inside an "imports/" folder
// next to this script — they were not included in the upload.
const iconePs = "./imports/images-2.png";
const iconeAi = "./imports/images-3.png";
const iconeAe = "./imports/download.png";
const iconeFigma = "./imports/images-1.png";
const iconeMaya = "./imports/images.png";
const iconeCanva = "./imports/images.jpg";

const PERFIL = {
  name: "Nathan Silva",
  firstName: "NATHAN",
  lastName: "SILVA",
  monogram: "N",
  roles: ["Designer Digital", "Direção de Arte", "Computação Gráfica"],
  tagline:
    "Em constante aprendizado, transformando cada projeto em uma oportunidade de experimentar, evoluir e ampliar meu repertório visual.",
  // Visual handle exactly as provided; complete the address at integration time.
  email: "nathsil3419",
  emailHref: "mailto:nathsil3419",
  location: "São Paulo, BR",
  available: true,
};

const REDES_SOCIAIS = [
  { label: "LinkedIn", handle: "/in/n4than-s1lv4", href: "https://www.linkedin.com/in/n4than-s1lv4/" },
  { label: "Behance", handle: "/nathansilva", href: "https://behance.net" },
  { label: "Instagram", handle: "@nath.silva", href: "https://instagram.com" },
  { label: "GitHub", handle: "/nathansilva", href: "https://github.com" },
];

/**
 * Ferramentas — sigla + nome + atmosfera cromática da própria marca.
 * `glow` alimenta o brilho/gradiente do card; `iconBg`/`iconFg` reproduzem
 * o lettermark oficial (estilo dos ícones Adobe) sem redesenhar o logo.
 */
const FERRAMENTAS = [
  { sigla: "PS", glyph: "Ps", name: "Adobe Photoshop", category: "Imagem & Retoque", glow: "#31A8FF", iconBg: "#001523", iconFg: "#31A8FF", img: iconePs },
  { sigla: "AI", glyph: "Ai", name: "Adobe Illustrator", category: "Vetor & Ilustração", glow: "#FF9A00", iconBg: "#2b0f00", iconFg: "#FF9A00", img: iconeAi },
  { sigla: "AE", glyph: "Ae", name: "Adobe After Effects", category: "Motion & VFX", glow: "#9D8CFF", iconBg: "#11002e", iconFg: "#C9BCFF", img: iconeAe },
  { sigla: "FIGMA", glyph: "F", name: "Figma", category: "UI & Protótipo", glow: "#A259FF", iconBg: "#160c22", iconFg: "#ffffff", img: iconeFigma },
  { sigla: "MAYA", glyph: "M", name: "Autodesk Maya", category: "3D & Modelagem", glow: "#14C7A8", iconBg: "#03231d", iconFg: "#37E6C4", img: iconeMaya },
  { sigla: "CANVA", glyph: "C", name: "Canva", category: "Design Rápido", glow: "#00C4CC", iconBg: "#04222b", iconFg: "#00C4CC", img: iconeCanva },
];

const NAVEGACAO = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "slides", label: "Slides" },
  { id: "contact", label: "Contact" },
];

const criarUrlImagem = (id, w = 1600, h = 1000) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;

const PROJETOS = [
  {
    slug: "neocortex",
    index: "01",
    title: "NEOCORTEX",
    category: "Branding / UI Design",
    year: "2025",
    software: "Figma · Illustrator · After Effects",
    role: "Direção de arte & UI",
    layout: "wide",
    cover: criarUrlImagem("1622737133809", 1600, 1000),
    summary:
      "Identidade e interface para uma plataforma de IA — um sistema visual que traduz inteligência em forma.",
    context:
      "A NEOCORTEX é uma startup de infraestrutura de IA que precisava de uma marca capaz de comunicar precisão técnica sem soar fria ou genérica.",
    challenge:
      "O desafio era construir um sistema flexível o bastante para produto, marketing e documentação, mantendo uma leitura instantânea da marca em qualquer contexto.",
    concept:
      "Partimos da ideia de sinapse — conexões que se acendem. A grid, os gradientes e o movimento nascem dessa metáfora, sempre a serviço da clareza.",
    process:
      "Exploração de logotipo e grid, definição do sistema tipográfico, protótipos de UI em Figma e testes de motion para transições de estado.",
    result:
      "Um design system completo com 40+ componentes, tokens de cor e uma linguagem de motion que reduziu o tempo de handoff em 30%.",
    gallery: [criarUrlImagem("1620641788421", 1400, 900), criarUrlImagem("1643139863038", 1400, 1800)],
    beforeAfter: { before: criarUrlImagem("1654198340681", 1200, 900), after: criarUrlImagem("1622737133809", 1200, 900) },
    metrics: [
      { k: "40+", v: "Componentes" },
      { k: "-30%", v: "Tempo de handoff" },
      { k: "3", v: "Plataformas" },
    ],
  },
  {
    slug: "sirius-consultoria",
    index: "02",
    title: "SIRIUS CONSULTORIA",
    category: "Brand Identity / Motion",
    year: "2024",
    software: "Illustrator · After Effects · Premiere",
    role: "Branding & motion design",
    layout: "tall",
    cover: criarUrlImagem("1716540103530", 1200, 1500),
    summary:
      "Rebranding e sistema de motion para uma consultoria financeira que queria parecer moderna sem perder a confiança.",
    context:
      "A SIRIUS atua há 15 anos no mercado, mas sua marca não acompanhava o posicionamento premium do serviço.",
    challenge:
      "Modernizar sem apagar o histórico — equilibrar sofisticação e credibilidade num mercado conservador.",
    concept:
      "Uma estrela-guia como símbolo de direção. O logotipo se desmonta e remonta em motion, reforçando a ideia de orientação.",
    process:
      "Auditoria da marca antiga, novo logotipo e paleta, kit de apresentações e uma bumper animada para vídeos institucionais.",
    result:
      "Nova identidade aplicada em 200+ peças e um sistema de motion usado em toda a comunicação da empresa.",
    gallery: [criarUrlImagem("1627384113972", 1400, 900), criarUrlImagem("1716193348750", 1400, 1400)],
    beforeAfter: { before: criarUrlImagem("1698376621013", 1200, 900), after: criarUrlImagem("1716540103530", 1200, 900) },
    metrics: [
      { k: "200+", v: "Peças aplicadas" },
      { k: "15 anos", v: "De história" },
      { k: "1", v: "Sistema de motion" },
    ],
  },
  {
    slug: "visual-study-mind",
    index: "03",
    title: "VISUAL STUDY — MIND",
    category: "Digital Art / Photoshop",
    year: "2025",
    software: "Photoshop · Camera Raw · Lightroom",
    role: "Direção de arte & retoque",
    layout: "wide",
    cover: criarUrlImagem("1654198340681", 1600, 1000),
    summary:
      "Estudo autoral de manipulação de imagem explorando a mente como paisagem — composição, luz e textura.",
    context:
      "Uma série pessoal de arte digital criada para investigar técnicas avançadas de composição e color grading.",
    challenge:
      "Fundir múltiplas fontes de imagem em uma cena coesa e crível, com iluminação e atmosfera unificadas.",
    concept:
      "A mente como espaço físico — camadas, névoa e fragmentos que se organizam em uma composição surreal.",
    process:
      "Coleta de referências, montagem base, blending de camadas, dodge & burn, e color grading final em Camera Raw.",
    result:
      "Série de 6 peças destacada em galerias de arte digital, com mais de 20 mil visualizações no Behance.",
    gallery: [criarUrlImagem("1549317336", 1400, 1800), criarUrlImagem("1620641788421", 1400, 900)],
    beforeAfter: { before: criarUrlImagem("1532123675048", 1200, 900), after: criarUrlImagem("1654198340681", 1200, 900) },
    metrics: [
      { k: "6", v: "Peças na série" },
      { k: "20k+", v: "Visualizações" },
      { k: "40+", v: "Camadas por peça" },
    ],
  },
  {
    slug: "3d-experiment",
    index: "04",
    title: "3D EXPERIMENT",
    category: "Maya / Modeling",
    year: "2024",
    software: "Autodesk Maya · Substance · Arnold",
    role: "Modelagem & look development",
    layout: "tall",
    cover: criarUrlImagem("1643139863038", 1200, 1500),
    summary:
      "Exploração de modelagem e render abstrato — forma, material e luz como único assunto da imagem.",
    context:
      "Projeto experimental para estudar fluxo de trabalho de modelagem procedural e materiais físicos.",
    challenge:
      "Alcançar realismo de material com tempos de render viáveis, mantendo a forma expressiva.",
    concept:
      "Objetos que parecem líquidos congelados — tensão entre rigidez e fluidez.",
    process:
      "Sculpt inicial, retopologia, UVs, materiais no Substance e iluminação HDRI no Arnold.",
    result:
      "Conjunto de 4 renders em alta resolução e um pipeline reutilizável de look development.",
    gallery: [criarUrlImagem("1718561193320", 1400, 900), criarUrlImagem("1622737133809", 1400, 1400)],
    beforeAfter: { before: criarUrlImagem("1627384113710", 1200, 900), after: criarUrlImagem("1643139863038", 1200, 900) },
    metrics: [
      { k: "4", v: "Renders finais" },
      { k: "4K", v: "Resolução" },
      { k: "1", v: "Pipeline reutilizável" },
    ],
  },
  {
    slug: "motion-studies",
    index: "05",
    title: "MOTION STUDIES",
    category: "After Effects / Motion Design",
    year: "2023",
    software: "After Effects · Cinema 4D · Premiere",
    role: "Motion design & animação",
    layout: "wide",
    cover: criarUrlImagem("1620641788421", 1600, 1000),
    summary:
      "Série de estudos de animação sobre ritmo, easing e transição — motion como linguagem, não decoração.",
    context:
      "Coleção diária de loops de animação criada para treinar princípios de movimento e timing.",
    challenge:
      "Manter consistência de estilo ao longo de dezenas de peças curtas produzidas em ritmo diário.",
    concept:
      "Movimento com propósito — cada loop resolve um princípio: antecipação, overshoot, easing, massa.",
    process:
      "Storyboard rápido, animação em After Effects, integração de elementos 3D do C4D e finalização.",
    result:
      "Mais de 30 loops publicados, com crescimento de 5x no engajamento do perfil ao longo da série.",
    gallery: [criarUrlImagem("1635776062360", 1400, 900), criarUrlImagem("1579546929518", 1400, 1400)],
    beforeAfter: { before: criarUrlImagem("1635776062127", 1200, 900), after: criarUrlImagem("1620641788421", 1200, 900) },
    metrics: [
      { k: "30+", v: "Loops publicados" },
      { k: "5x", v: "Engajamento" },
      { k: "90", v: "Dias de série" },
    ],
  },
];

const GRUPOS_HABILIDADES = [
  { label: "Design & Interface", items: ["Photoshop", "Illustrator", "Figma", "Slide Design"] },
  { label: "Motion & Animação", items: ["After Effects", "Premiere"] },
  { label: "3D & Modelagem", items: ["Autodesk Maya", "Cinema 4D"] },
  { label: "Branding & Identidade", items: ["Visual Identity", "Art Direction", "Graphic Systems"] },
];

/* ------------------------------------------------------------------ */
/* Slide / presentation design — interactive deck preview             */
/* ------------------------------------------------------------------ */

const APRESENTACAO = {
  name: "NEOCORTEX — Brand Pitch",
  meta: "Keynote · Figma · 6 slides",
  slides: [
    {
      kind: "cover",
      kicker: "Brand Pitch · 2025",
      title: "NEOCORTEX",
      subtitle: "Um sistema visual para uma plataforma de IA.",
      foot: "Apresentação por Nathan Silva",
    },
    {
      kind: "agenda",
      title: "Agenda",
      items: ["Contexto & objetivo", "Conceito criativo", "Sistema visual", "Aplicações", "Próximos passos"],
    },
    {
      kind: "stat",
      big: "40+",
      label: "componentes no design system",
      sub: "Tokens de cor, grid e uma linguagem de motion — tudo documentado para o time.",
    },
    {
      kind: "image",
      title: "Aplicações",
      caption: "Do produto ao marketing, uma leitura instantânea da marca.",
      img: criarUrlImagem("1622737133809", 1200, 700),
    },
    {
      kind: "quote",
      quote: "\u201cInteligência traduzida em forma — clareza antes de qualquer decoração.\u201d",
      who: "Princípio de direção de arte",
    },
    {
      kind: "close",
      title: "Obrigado.",
      sub: "Vamos criar algo juntos?",
      foot: "nathsil3419",
    },
  ],
};

const HISTORICO_TRABALHO = [
  ["Projetos Freelance", "Design & Motion", "2023 — Hoje"],
  ["Estúdio Nakalang", "Estágio em Design", "2022 — 2023"],
  ["Formação Técnica", "Computação Gráfica", "2020 — 2022"],
];
