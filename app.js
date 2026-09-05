/* ==================================================================== */
/* ESTADO GLOBAL DO APP — Máquina de estado central                      */
/* ==================================================================== */

let visao = { name: "home" }; // { name: "home" } | { name: "project", slug }
let secaoAtiva = NAVEGACAO[0].id;
let navRolada = false;
let menuMovelAberto = false;
let indiceCarrossel = 0;
let posicaoComparacao = 50; // Posição do controle deslizante de Antes/Depois (%)
let emailCopiado = false;
let modoClaro = false;
let valoresContato = { name: "", email: "", subject: "", message: "" };
let estadoContato = "idle"; // idle | typing | submitting | aguardandoCodigo | reenviandoCodigo | confirmandoCodigo | success | error
let errosContato = {};

/* SEÇÃO 0 — TEMA (DARK MODE / LIGHT MODE) */

function aplicarTema() {
  document.documentElement.dataset.theme = modoClaro ? "light" : "dark";
}

const RETRATO =
  "https://images.unsplash.com/photo-1563279004-a1dfc38cba96?w=900&h=1100&fit=crop&auto=format";

function emHome() {
  return visao.name === "home";
}

function projetoAtual() {
  if (visao.name !== "project") return undefined;
  return PROJETOS.find((p) => p.slug === visao.slug);
}

/* SEÇÃO 1 — NAVEGAÇÃO: Ações e Navegação */

function irParaSecao(id) {
  menuMovelAberto = false;
  const scroll = () => {
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
  if (!emHome()) {
    visao = { name: "home" };
    renderizarApp();
    requestAnimationFrame(() => requestAnimationFrame(scroll));
  } else {
    renderizarApp();
    scroll();
  }
}

function abrirProjeto(slug) {
  visao = { name: "project", slug };
  window.scrollTo({ top: 0, behavior: "instant" });
  renderizarApp();
}

function voltarParaProjetos() {
  visao = { name: "home" };
  renderizarApp();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.getElementById("work")?.scrollIntoView({ behavior: "smooth" })),
  );
}

/* ==================================================================== */
/* Primitivos pequenos                                                   */
/* ==================================================================== */

function Sobrancelha(text) {
  const [num, label] = text.includes("—") ? text.split("—").map((s) => s.trim()) : ["", text];
  const classeLinha = modoClaro ? "bg-black/30" : "bg-white/30";
  const classeRotulo = modoClaro ? "text-black/50" : "text-white/30";
  return `
    <div class="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.28em]">
      ${num ? `<span class="text-red">${num}</span>` : ""}
      <span class="h-px w-12 ${classeLinha}"></span>
      <span class="${classeRotulo}">${label || text}</span>
    </div>`;
}

/* ==================================================================== */
/* SEÇÃO 1 — HEADER / NAVEGAÇÃO */
/* ==================================================================== */

const ROTULOS_NAVEGACAO = { home: "Início", work: "Projetos", about: "Sobre", skills: "Skills", slides: "Slides" };
const ORDEM_NAVEGACAO = ["work", "skills", "slides", "about"];

function renderizarNavegacao() {
  const itensNavegacao = ORDEM_NAVEGACAO.map((id) => NAVEGACAO.find((n) => n.id === id)).filter(Boolean);

  const itensDesktop = itensNavegacao
    .map((n) => {
      const estaAtiva = emHome() && secaoAtiva === n.id;
      return `
      <button data-nav="${n.id}" aria-current="${estaAtiva ? "true" : ""}"
        class="relative rounded-full px-4 py-1.5 text-sm transition-colors ${estaAtiva ? "text-white" : "text-mist hover:text-white"}">
        ${estaAtiva ? `<span class="absolute inset-0 -z-10 rounded-full bg-white/8"></span>` : ""}
        ${ROTULOS_NAVEGACAO[n.id] ?? n.label}
      </button>`;
    })
    .join("");

  const itensMobile = itensNavegacao
    .map(
      (n, i) => `
      <button data-nav="${n.id}"
        class="flex w-full items-center justify-between border-b border-white/5 py-3.5 text-left font-display text-lg last:border-0 ${
          emHome() && secaoAtiva === n.id ? "text-red" : ""
        }">
        ${ROTULOS_NAVEGACAO[n.id] ?? n.label}
        <span class="font-mono text-xs text-mist">0${i + 1}</span>
      </button>`,
    )
    .join("");

  const themeToggleLabel = modoClaro ? "Ativar tema escuro" : "Ativar tema claro";
  const themeToggleIcon = modoClaro
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4"><path d="M12 3v2.2M12 18.8V21M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M3 12h2.2M18.8 12H21M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56"></path><circle cx="12" cy="12" r="4.2"></circle></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4"><path d="M21 12.8A8.8 8.8 0 0 1 11.2 3a8.8 8.8 0 1 0 9.8 9.8Z"></path></svg>`;

  const navShellClasses = navRolada
    ? modoClaro
      ? "border border-black/10 bg-white/[0.08] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)] backdrop-blur-2xl backdrop-saturate-150"
      : "border border-white/15 bg-white/[0.06] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl backdrop-saturate-150"
    : "border border-transparent bg-transparent shadow-none";

  return `
    <div class="mx-auto max-w-7xl px-4 sm:px-8">
      <nav aria-label="Principal" class="flex w-full items-center justify-between rounded-full px-3 py-2 transition-all duration-500 ${navShellClasses}">
        <button data-nav="home" class="group flex items-center gap-2 pl-1" data-cursor="Home">
          <span class="grid h-8 w-8 place-items-center rounded-full bg-red font-display text-sm font-black transition-transform duration-300 group-hover:rotate-[10deg] group-hover:scale-105">${PERFIL.monogram}</span>
          <span class="font-display text-sm font-bold ${modoClaro ? "text-[#111111]" : "text-white"}">${PERFIL.name}</span>
        </button>

<div class="hidden items-center gap-1 md:flex">${itensDesktop}</div>

        <div class="flex items-center gap-2">
          <button type="button" data-theme-toggle aria-label="${themeToggleLabel}" aria-pressed="${modoClaro}" title="${themeToggleLabel}"
            class="grid h-9 w-9 place-items-center rounded-full border ${modoClaro ? "border-black/15 bg-transparent text-[#1E1E1E]" : "border-line bg-transparent text-mist"} transition-all duration-300 hover:border-red hover:text-red">
            ${themeToggleIcon}
          </button>
          <button data-nav="contact" class="rounded-full bg-red px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(255,45,63,0.7)] transition-transform hover:scale-[1.04] active:scale-95">Contato</button>
          <button aria-label="${menuMovelAberto ? "Fechar menu" : "Abrir menu"}" aria-expanded="${menuMovelAberto}" data-toggle-menu
            class="grid h-9 w-9 place-items-center rounded-full border ${modoClaro ? "border-black/15" : "border-white/10"} md:hidden">
            <span class="relative block h-[10px] w-4">
              <span class="absolute left-0 top-0 h-[1.5px] w-full ${modoClaro ? "bg-[#1E1E1E]" : "bg-white"} transition-all ${menuMovelAberto ? "translate-y-[4px] rotate-45" : ""}"></span>
              <span class="absolute bottom-0 left-0 h-[1.5px] w-full ${modoClaro ? "bg-[#1E1E1E]" : "bg-white"} transition-all ${menuMovelAberto ? "-translate-y-[4px] -rotate-45" : ""}"></span>
            </span>
          </button>
        </div>
      </nav>

      ${
        menuMovelAberto
          ? `<div class="absolute top-[72px] w-[calc(100%-2rem)] max-w-4xl rounded-3xl border border-line bg-black/95 p-3 backdrop-blur-xl md:hidden">${itensMobile}</div>`
          : ""
      }
    </div>`;
}

/* ==================================================================== */
/* Hero                                                                   */
/* ==================================================================== */

function renderizarInicio() {
  return `
  <section id="home" class="relative flex min-h-screen flex-col overflow-hidden px-6 pt-[92px] pb-12 sm:px-10 sm:pt-[104px] sm:pb-16">
    <div class="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-b ${modoClaro ? "from-[#fff5f6] via-[#f5f4f2] to-[#f4f1ee]" : "from-[#2c0509] via-[#0c0203] to-black"}"></div>
    <div class="pointer-events-none absolute inset-0 -z-20 ${modoClaro ? "bg-[radial-gradient(120%_65%_at_50%_0%,rgba(255,10,36,0.12),transparent_60%)]" : "bg-[radial-gradient(120%_65%_at_50%_0%,rgba(0,0,0,0.15),transparent_60%)]"}"></div>
    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col">
      ${
        PERFIL.available
          ? `<div class="revelar mt-[8vh] flex justify-center sm:mt-[10vh]">
              <span class="inline-flex items-center gap-2 rounded-full border ${modoClaro ? "border-black/15 bg-transparent text-[#111111]" : "border-red/40 bg-black/40 text-white/90"} px-4 py-1.5 font-display text-[11px] font-medium uppercase tracking-[0.08em] backdrop-blur-sm sm:text-[13px]">
                <span class="h-1.5 w-1.5 rounded-full bg-red"></span>
                Disponível para novos projetos
              </span>
            </div>`
          : ""
      }

      <div class="relative mt-6 sm:mt-8">
        <div class="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red opacity-[0.16] blur-[130px] sm:h-[560px] sm:w-[560px]"></div>
        <h1 class="revelar text-center font-display font-black uppercase leading-[0.82] tracking-[-0.045em]">
          <span class="block ${modoClaro ? "text-[#111111]" : "text-white"} text-[15vw] sm:text-[12vw] lg:text-[10.5rem]">Expanda</span>
          <span class="mt-4 block text-[15vw] text-red sm:mt-6 sm:text-[12vw] lg:mt-8 lg:text-[10.5rem]">Limites</span>
        </h1>
      </div>

      <div class="mt-[7vh] flex flex-col gap-8 sm:mt-16 sm:flex-row sm:items-end sm:justify-between">
        <p class="revelar max-w-md text-base leading-relaxed ${modoClaro ? "text-[#4A4A4A]" : "text-mist"} sm:text-lg">${PERFIL.tagline}</p>
        <div class="revelar flex flex-wrap gap-3 sm:justify-end">
          <button data-nav="work" data-cursor="Ver projetos"
            class="group inline-flex items-center gap-2.5 rounded-full bg-red px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(255,45,63,0.7)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_14px_48px_-8px_rgba(255,45,63,0.85)] active:scale-95">
            Ver projetos
            <span class="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </button>
          <button data-nav="contact" data-cursor="Fale comigo"
            class="group inline-flex items-center gap-2.5 rounded-full border ${modoClaro ? "border-black/15 bg-transparent text-[#111111]" : "border-white/15 bg-white/[0.04] text-white/90"} px-6 py-3.5 text-sm font-semibold backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/[0.08] hover:text-white active:scale-95">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
            Fale comigo
          </button>
        </div>
      </div>
    </div>
  </section>`;
}

/* ==================================================================== */
/* Project card + Selected work                                          */
/* ==================================================================== */

function CartaoProjeto(project, mediaClassName) {
  return `
  <article class="revelar group">
    <button data-open-project="${project.slug}" data-cursor="Ver projeto" class="block w-full text-left">
      <div class="relative overflow-hidden rounded-3xl border border-line bg-panel ${mediaClassName}">
        <img src="${project.cover}" alt="${project.title}" loading="lazy"
          class="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 opacity-80 transition-opacity duration-500 group-hover:opacity-95"></div>
        <span class="absolute left-5 top-5 font-mono text-[11px] tracking-[0.2em] text-white/70 sm:left-7 sm:top-7">${project.index} / ${project.year}</span>
        <p class="absolute inset-x-6 bottom-24 max-w-md translate-y-3 text-sm leading-relaxed text-white/90 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:inset-x-8 sm:text-base">${project.summary}</p>
      </div>
      <div class="mt-4 sm:mt-5">
        <h3 class="font-display text-lg font-extrabold transition-transform duration-500 group-hover:translate-x-1 sm:text-xl lg:text-2xl">${project.title}</h3>
        <div class="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-red">${project.category}</div>
      </div>
    </button>
  </article>`;
}

function renderizarProjetosSelecionados() {
  const rows = [];
  for (let i = 0; i < PROJETOS.length; i += 2) rows.push(PROJETOS.slice(i, i + 2));

  const rowsHtml = rows
    .map((row, ri) => {
      const bigLeft = ri % 2 === 0;
      const cols = bigLeft ? "sm:grid-cols-[214fr_152fr]" : "sm:grid-cols-[152fr_214fr]";
      const cards = row
        .map((p, ci) => {
          const isBig = bigLeft ? ci === 0 : ci === 1;
          return CartaoProjeto(p, isBig ? "aspect-[214/147]" : "aspect-[152/105]");
        })
        .join("");
      return `<div class="grid grid-cols-1 items-start gap-3 sm:gap-3 ${cols}">${cards}</div>`;
    })
    .join("");

  return `
  <section id="work" class="mx-auto max-w-7xl scroll-mt-[-2.5rem] sm:scroll-mt-[-4rem] px-5 py-24 sm:px-8 sm:py-32">
    <div class="revelar mb-14 flex flex-wrap items-end justify-between gap-6">
      <div>
        ${Sobrancelha("01 — Selected Work")}
        <h2 class="mt-4 font-display text-5xl font-extrabold uppercase sm:text-7xl">Projetos <span class="text-red">selecionados</span></h2>
      </div>
      <p class="max-w-xs text-sm text-mist">Cinco casos entre branding, arte digital, 3D e motion — cada um com um problema visual resolvido.</p>
    </div>
    <div class="flex flex-col gap-14 sm:gap-16">${rowsHtml}</div>
  </section>`;
}

/* ==================================================================== */
/* About                                                                  */
/* ==================================================================== */

function renderizarSobre() {
  const history = HISTORICO_TRABALHO.map(
    ([c, role, yr]) => `
    <li class="flex items-center justify-between py-4">
      <div>
        <div class="font-display font-bold">${c}</div>
        <div class="text-sm text-mist">${role}</div>
      </div>
      <div class="font-mono text-xs text-mist">${yr}</div>
    </li>`,
  ).join("");

  return `
  <section id="about" class="scroll-mt-[-2.5rem] sm:scroll-mt-[-4rem] bg-surface">
    <div class="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-12">
      <div class="revelar lg:col-span-5">
        <div class="relative overflow-hidden rounded-3xl">
          <img data-parallax="0.06" src="${RETRATO}" alt="${PERFIL.name}" class="aspect-[4/5] w-full scale-110 object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-red-deep/70 via-red/10 to-transparent mix-blend-multiply"></div>
          <div class="absolute inset-x-0 bottom-0 p-6">
            <div class="font-display text-2xl font-extrabold">${PERFIL.name}</div>
            <div class="text-sm text-white/85">Designer Digital · Diretor de Arte</div>
          </div>
        </div>
      </div>

      <div class="revelar lg:col-span-7 lg:pt-2">
        ${Sobrancelha("02 — About")}
        <div class="mt-6 space-y-5 text-xl leading-relaxed text-mist">
          <p>Sou <span class="text-white">${PERFIL.name}</span>, um designer digital em constante desenvolvimento. Comecei explorando composição, imagem e ideias criativas — e sigo ampliando meu repertório a cada novo projeto.</p>
          <p>Tenho formação em <span class="text-white">Técnico em Computação Gráfica</span> e uso essa base para experimentar entre design, motion, 3D e direção de arte, curioso por áreas que ainda estou descobrindo.</p>
          <p class="text-white">Aprendizado, experimentação, prática e evolução — cada trabalho é uma chance de crescer.</p>
        </div>

        <div class="mt-10">
          <div class="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-mist">Experiência</div>
          <ul class="divide-y divide-line border-y border-line">${history}</ul>
        </div>
      </div>
    </div>
  </section>`;
}

/* ==================================================================== */
/* Skills                                                                 */
/* ==================================================================== */

const ICONES_HABILIDADES = [
  `<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"></path>
   <path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path>`,
  `<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"></path>
   <path d="m6.2 5.3 3.1 3.9"></path><path d="m12.4 3.4 3.1 4"></path>
   <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path>`,
  `<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"></path>
   <path d="m7 16.5-4.74-2.85"></path><path d="m7 16.5 5-3"></path><path d="M7 16.5v5.17"></path>
   <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"></path>
   <path d="m17 16.5-5-3"></path><path d="m17 16.5 4.74-2.85"></path><path d="M17 16.5v5.17"></path>
   <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"></path>
   <path d="M12 8 7.26 5.15"></path><path d="m12 8 4.74-2.85"></path><path d="M12 13.5V8"></path>`,
  `<path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"></path>
   <path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"></path>
   <path d="m2.3 2.3 7.286 7.286"></path><circle cx="11" cy="11" r="2"></circle>`,
];

function renderizarGruposHabilidades() {
  return `
  <div class="grid gap-4 sm:grid-cols-2">
    ${GRUPOS_HABILIDADES.map(
      (g, i) => `
      <div style="transition-delay:${(i % 2) * 80}ms" class="revelar group flex min-h-[168px] flex-col rounded-2xl border border-line bg-panel p-6 transition-colors duration-500 hover:border-red/40">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-6 w-6 text-red transition-transform duration-500 group-hover:scale-110">
          ${ICONES_HABILIDADES[i % ICONES_HABILIDADES.length]}
        </svg>
        <h3 class="mt-4 font-display text-xl font-bold leading-tight sm:text-2xl">${g.label}</h3>
        <div class="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          ${g.items.map((item) => `<span class="text-sm text-mist transition-colors group-hover:text-white">${item}</span>`).join("")}
        </div>
      </div>`,
    ).join("")}
  </div>`;
}

function renderizarSelosFerramentas() {
  const loop = [...FERRAMENTAS, ...FERRAMENTAS];
  const items = loop
    .map(
      (t, i) => `
      <button type="button" data-cursor="" aria-label="${t.name}" tabindex="${i >= FERRAMENTAS.length ? -1 : 0}" aria-hidden="${i >= FERRAMENTAS.length}"
        class="group relative flex shrink-0 items-center outline-none">
        <span class="relative block transition-transform duration-300 ease-out group-hover:scale-110 group-focus-visible:scale-110 group-active:scale-95">
          <span aria-hidden="true" class="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-90 group-focus-visible:opacity-90 group-active:opacity-90" style="background-color:${t.glow}"></span>
          <span class="relative block"><img src="${t.img}" alt="${t.name}" loading="lazy" draggable="false" class="h-11 w-11 select-none object-contain" /></span>
        </span>
        <span class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 -translate-y-1 whitespace-nowrap rounded-md border border-line bg-black/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-active:translate-y-0 group-active:opacity-100">${t.name}</span>
      </button>`,
    )
    .join("");

  return `
  <div class="revelar">
    <div class="mb-5 font-mono text-[11px] uppercase tracking-[0.28em] text-mist">Ferramentas que exploro</div>
    <div class="mascara-rolagem relative overflow-hidden border-y border-line py-4 sm:py-5">
      <div class="faixa-rolagem flex w-max items-center gap-16 pr-16 sm:gap-24 sm:pr-24">${items}</div>
    </div>
    <p class="mt-6 max-w-xl text-sm text-mist">Um kit em crescimento — cada ferramenta é um território que sigo explorando, projeto após projeto.</p>
  </div>`;
}

function renderizarHabilidades() {
  return `
  <section id="skills" class="mx-auto max-w-7xl scroll-mt-[-2.5rem] sm:scroll-mt-[-4rem] px-5 py-24 sm:px-8 sm:py-32">
    <div class="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div class="revelar lg:col-span-5">
        ${Sobrancelha("03 — Software / Skills")}
        <h2 class="mt-4 font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl">O que eu ajudo a <span class="text-red">moldar…</span></h2>
        <p class="mt-6 max-w-sm text-lg leading-relaxed text-mist">Territórios que atravesso projeto após projeto — do conceito à peça final.</p>
      </div>
      <div class="lg:col-span-7">${renderizarGruposHabilidades()}</div>
    </div>
    <div class="mt-16 sm:mt-20">${renderizarSelosFerramentas()}</div>
  </section>`;
}

/* ==================================================================== */
/* Presentations / Slide deck                                            */
/* ==================================================================== */

function VisualizacaoSlide(slide) {
  const h1 = "font-display font-black leading-[0.9] text-[clamp(1.75rem,6cqw,5rem)]";
  const label = "font-mono uppercase tracking-[0.28em] text-[clamp(0.55rem,1.4cqw,0.75rem)]";
  const body = "text-[clamp(0.8rem,2.2cqw,1.35rem)] leading-relaxed";

  switch (slide.kind) {
    case "cover":
      return `
        <div class="flex h-full flex-col justify-between p-[6cqw]">
          <div class="${label} text-red">${slide.kicker}</div>
          <div>
            <h3 class="${h1} text-white">${slide.title}</h3>
            <p class="${body} mt-[2cqw] max-w-[75%] text-mist">${slide.subtitle}</p>
          </div>
          <div class="${label} text-mist">${slide.foot}</div>
        </div>`;
    case "agenda":
      return `
        <div class="grid h-full grid-cols-1 gap-[3cqw] p-[6cqw] sm:grid-cols-[auto_1fr] sm:items-center">
          <h3 class="${h1} text-red">${slide.title}</h3>
          <ol class="space-y-[1.6cqw]">
            ${slide.items
              .map(
                (it, i) => `
              <li class="${body} flex items-center gap-[2cqw] text-white/90">
                <span class="font-mono text-red text-[clamp(0.6rem,1.6cqw,0.9rem)]">0${i + 1}</span>${it}
              </li>`,
              )
              .join("")}
          </ol>
        </div>`;
    case "stat":
      return `
        <div class="flex h-full flex-col justify-center p-[6cqw]">
          <div class="font-display font-black leading-none text-red text-[clamp(3rem,18cqw,11rem)]">${slide.big}</div>
          <div class="${body} mt-[2cqw] font-display font-bold text-white">${slide.label}</div>
          <p class="${body} mt-[1cqw] max-w-[80%] text-mist">${slide.sub}</p>
        </div>`;
    case "image":
      return `
        <div class="relative h-full">
          <img src="${slide.img}" alt="${slide.title}" class="absolute inset-0 h-full w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
          <div class="absolute inset-x-0 bottom-0 p-[6cqw]">
            <h3 class="${h1} text-white">${slide.title}</h3>
            <p class="${body} mt-[1cqw] max-w-[70%] text-white/85">${slide.caption}</p>
          </div>
        </div>`;
    case "quote":
      return `
        <div class="flex h-full flex-col justify-center p-[8cqw]">
          <p class="font-display font-bold leading-snug text-white text-[clamp(1.1rem,4.2cqw,2.75rem)]">${slide.quote}</p>
          <div class="${label} mt-[3cqw] text-red">${slide.who}</div>
        </div>`;
    case "close":
      return `
        <div class="flex h-full flex-col items-start justify-center gap-[2cqw] p-[8cqw]">
          <h3 class="${h1} text-white">${slide.title}</h3>
          <p class="${body} text-mist">${slide.sub}</p>
          <div class="${label} mt-[2cqw] rounded-full border border-line px-[3cqw] py-[1.5cqw] text-white">${slide.foot}</div>
        </div>`;
    default:
      return "";
  }
}

function renderizarApresentacaoSlides() {
  const total = APRESENTACAO.slides.length;
  const slidesHtml = APRESENTACAO.slides
    .map(
      (s, idx) => `
      <div aria-hidden="${idx !== indiceCarrossel}" class="absolute inset-0 transition-all duration-500 ease-out"
        style="opacity:${idx === indiceCarrossel ? 1 : 0};transform:translateX(${(idx - indiceCarrossel) * 4}%);pointer-events:${idx === indiceCarrossel ? "auto" : "none"}">
        ${VisualizacaoSlide(s)}
      </div>`,
    )
    .join("");

  const dots = APRESENTACAO.slides
    .map(
      (_, idx) => `
      <button data-deck-goto="${idx}" aria-label="Ir para o slide ${idx + 1}" aria-current="${idx === indiceCarrossel}"
        class="h-2 rounded-full transition-all duration-300 ${idx === indiceCarrossel ? "w-7 bg-red" : "w-2 bg-white/25 hover:bg-white/50"}"></button>`,
    )
    .join("");

  return `
  <div class="revelar">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div class="font-display text-lg font-bold sm:text-xl">${APRESENTACAO.name}</div>
        <div class="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">${APRESENTACAO.meta}</div>
      </div>
      <div class="flex items-center gap-2">
        <button data-deck-prev aria-label="Slide anterior" class="grid h-10 w-10 place-items-center rounded-full border border-line text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 active:scale-90">←</button>
        <span class="w-14 text-center font-mono text-xs text-mist">${String(indiceCarrossel + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
        <button data-deck-next aria-label="Próximo slide" class="grid h-10 w-10 place-items-center rounded-full border border-line text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 active:scale-90">→</button>
      </div>
    </div>

    <div id="deck-stage" tabindex="0" role="group" aria-roledescription="carrossel" aria-label="${APRESENTACAO.name}, slide ${indiceCarrossel + 1} de ${total}"
      data-cursor="carousel" data-deck-next style="container-type:inline-size"
      class="relative aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-[clamp(1rem,2.5vw,1.75rem)] border border-line bg-surface outline-none focus-visible:ring-2 focus-visible:ring-red/50">
      ${slidesHtml}
      <div class="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
        <div class="h-full bg-red transition-[width] duration-500" style="width:${((indiceCarrossel + 1) / total) * 100}%"></div>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-center gap-2">${dots}</div>
  </div>`;
}

function renderizarApresentacoes() {
  return `
  <section id="slides" class="scroll-mt-[-2.5rem] sm:scroll-mt-[-4rem] border-t border-line bg-surface">
    <div class="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
      <div class="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div class="revelar lg:col-span-4">
          ${Sobrancelha("04 — Apresentações")}
          <h2 class="mt-4 font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl">Slide <span class="text-red">design</span></h2>
          <p class="mt-6 max-w-sm text-lg leading-relaxed text-mist">Também desenho apresentações — pitch decks e keynotes que organizam a informação com a mesma hierarquia visual do resto do meu trabalho.</p>
          <p class="mt-4 max-w-sm text-sm text-mist">Navegue pelos slides: <span class="text-white">clique, use as setas ou arraste</span> no toque.</p>
        </div>
        <div id="deck-container" class="lg:col-span-8">${renderizarApresentacaoSlides()}</div>
      </div>
    </div>
  </section>`;
}

/* ==================================================================== */
/* Contact — email link, social links, form                              */
/* ==================================================================== */

function renderizarLinkEmail() {
  return `
    <a href="${PERFIL.emailHref}" data-copy-email data-cursor="${emailCopiado ? "Copiado" : "Copiar"}" class="group inline-flex items-center gap-3">
      <span class="sublinhado-link font-display font-bold">${PERFIL.email}</span>
      <span class="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-all duration-200 ${
        emailCopiado ? "border-green-500 text-green-400" : "border-line text-mist group-hover:border-red group-hover:text-red"
      }">${emailCopiado ? "copiado ✓" : "copiar"}</span>
    </a>`;
}

function renderizarRedesSociaisCompacto() {
  return `
    <div class="flex w-full flex-wrap gap-3">
      ${REDES_SOCIAIS.map(
        (s) => `
        <a href="${s.href}" target="_blank" rel="noreferrer"
          class="flex-1 whitespace-nowrap rounded-full border border-line px-4 py-2.5 text-center font-display text-sm font-semibold transition-colors hover:border-red hover:text-red">${s.label}</a>`,
      ).join("")}
    </div>`;
}

function classesCampo() {
  return "w-full rounded-2xl border border-line bg-panel px-4 py-3.5 text-white placeholder:text-mist/60 outline-none transition-all focus:border-red focus:ring-2 focus:ring-red/30";
}

function renderizarFormularioContato() {
  const f = classesCampo();
  return `
  <form id="contact-form" novalidate class="revelar space-y-4" aria-label="Formulário de contato">
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="name" class="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.2em] text-mist">Nome</label>
        <input id="name" name="name" value="${valoresContato.name}" placeholder="Seu nome" class="${f}" aria-invalid="${!!errosContato.name}" />
        ${errosContato.name ? `<p class="mt-1.5 text-xs text-red">${errosContato.name}</p>` : ""}
      </div>
      <div>
        <label for="email" class="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.2em] text-mist">E-mail</label>
        <input id="email" name="email" type="email" value="${valoresContato.email}" placeholder="voce@email.com" class="${f}" aria-invalid="${!!errosContato.email}" />
        ${errosContato.email ? `<p class="mt-1.5 text-xs text-red">${errosContato.email}</p>` : ""}
      </div>
    </div>
    <div>
      <label for="subject" class="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.2em] text-mist">Assunto</label>
      <input id="subject" name="subject" value="${valoresContato.subject}" placeholder="Sobre o que vamos falar?" class="${f}" aria-invalid="${!!errosContato.subject}" />
      ${errosContato.subject ? `<p class="mt-1.5 text-xs text-red">${errosContato.subject}</p>` : ""}
    </div>
    <div>
      <label for="message" class="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.2em] text-mist">Mensagem</label>
      <textarea id="message" name="message" rows="6" placeholder="Conte sobre seu projeto…" class="${f} resize-none" aria-invalid="${!!errosContato.message}">${valoresContato.message}</textarea>
      ${errosContato.message ? `<p class="mt-1.5 text-xs text-red">${errosContato.message}</p>` : ""}
    </div>

    <div class="flex flex-wrap items-center gap-4 pt-2">
      <button type="submit" ${estadoContato === "submitting" ? "disabled" : ""}
        class="group inline-flex items-center gap-3 rounded-full bg-red px-7 py-3.5 font-display font-semibold text-white transition-all duration-300 hover:gap-4 hover:shadow-[0_12px_40px_-10px_rgba(255,45,63,0.7)] active:scale-95 disabled:opacity-60">
        ${
          estadoContato === "submitting"
            ? `<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>Enviando…`
            : `Enviar mensagem<span class="grid h-6 w-6 place-items-center rounded-full bg-white/25 transition-transform group-hover:rotate-45">↗</span>`
        }
      </button>

      ${
        estadoContato === "success"
          ? `<span role="status" class="inline-flex items-center gap-2 text-sm text-green-400">
              <span class="grid h-5 w-5 place-items-center rounded-full bg-green-500 text-xs text-black">✓</span>
              Mensagem enviada — retorno em até 24h.
            </span>`
          : ""
      }
      ${estadoContato === "error" ? `<span role="alert" class="text-sm text-red">Revise os campos destacados.</span>` : ""}
    </div>
  </form>`;
}

function renderizarContato() {
  return `
  <section id="contact" class="relative scroll-mt-[-2.5rem] sm:scroll-mt-[-4rem] overflow-hidden bg-surface">
    <div class="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-red opacity-[0.14] blur-[140px]"></div>
    <div class="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
      <div class="revelar">
        ${Sobrancelha("05 — Contact")}
        <h2 class="mt-4 max-w-4xl font-display text-6xl font-black uppercase leading-[0.92] sm:text-8xl">Vamos criar <span class="text-red">algo</span>?</h2>
      </div>

      <div class="mt-16 border-t border-line pt-12">
        <div class="revelar mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-mist">Redes</div>
        <div id="email-link" class="revelar mb-5">${renderizarLinkEmail()}</div>
        ${renderizarRedesSociaisCompacto()}
      </div>

      <div class="mt-14 border-t border-line pt-12">
        <div class="mx-auto max-w-4xl">
          <div class="revelar mb-6 font-mono text-[11px] uppercase tracking-[0.28em] text-mist">Envie uma mensagem</div>
          <div id="contact-form-container">${renderizarFormularioContato()}</div>
        </div>
      </div>
    </div>

    <div class="relative select-none overflow-hidden">
      <div class="font-display text-[26vw] font-black leading-[0.75] tracking-[-0.04em] text-red">${PERFIL.firstName} ${PERFIL.lastName}</div>
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-transparent to-surface/60"></div>
    </div>
  </section>`;
}

/* ==================================================================== */
/* Divisor + Home + Footer                                               */
/* ==================================================================== */

function Divisor() {
  return `<div class="mx-auto max-w-7xl px-4 sm:px-8"><div class="h-px w-full bg-white/[0.06]"></div></div>`;
}

function renderizarPaginaInicial() {
  return `
  <div class="entrada-pagina">
    ${renderizarInicio()}
    ${Divisor()}
    ${renderizarProjetosSelecionados()}
    ${Divisor()}
    ${renderizarSobre()}
    ${Divisor()}
    ${renderizarHabilidades()}
    ${renderizarApresentacoes()}
    ${renderizarContato()}
  </div>`;
}

function renderizarRodape() {
  return `
    <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-mist sm:px-8">
      <div class="flex flex-wrap gap-6">
        ${NAVEGACAO.slice(1)
          .map((n) => `<button data-nav="${n.id}" class="sublinhado-link hover:text-white">${n.label}</button>`)
          .join("")}
      </div>
      <div class="font-mono text-xs">© 2026 ${PERFIL.name} — ${PERFIL.location}</div>
    </div>`;
}

/* ==================================================================== */
/* Project detail page                                                   */
/* ==================================================================== */

function Bloco(label, content) {
  return `
    <div class="revelar grid gap-3 border-t border-line py-10 sm:grid-cols-[160px_1fr] sm:gap-10">
      <div class="font-mono text-[11px] uppercase tracking-[0.28em] text-red">${label}</div>
      <p class="max-w-2xl text-lg leading-relaxed text-white/85">${content}</p>
    </div>`;
}

function renderizarAntesDepois(project) {
  return `
    <div id="before-after" data-slug="${project.slug}"
      class="relative aspect-[16/10] w-full cursor-ew-resize select-none overflow-hidden rounded-3xl border border-line">
      <img src="${project.beforeAfter.after}" alt="Depois" class="absolute inset-0 h-full w-full object-cover" />
      <div id="ba-before-wrap" class="absolute inset-0 overflow-hidden" style="width:${posicaoComparacao}%">
        <img id="ba-before-img" src="${project.beforeAfter.before}" alt="Antes" class="absolute inset-0 h-full w-full object-cover" style="max-width:none" />
        <span class="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest backdrop-blur">Antes</span>
      </div>
      <span class="absolute right-4 top-4 rounded-full bg-red/80 px-3 py-1 font-mono text-[11px] uppercase tracking-widest backdrop-blur">Depois</span>
      <div id="ba-handle" class="absolute inset-y-0 w-[2px] bg-white" style="left:${posicaoComparacao}%">
        <div class="absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-black/50 text-xs backdrop-blur">⇄</div>
      </div>
    </div>`;
}

function renderizarDetalheProjeto(project) {
  if (!project) return "";
  const idx = PROJETOS.findIndex((p) => p.slug === project.slug);
  const next = PROJETOS[(idx + 1) % PROJETOS.length];

  const meta = [
    ["Categoria", project.category],
    ["Ano", project.year],
    ["Software", project.software],
    ["Função", project.role],
  ];

  const metaHtml = meta
    .map(
      ([k, v]) => `
      <div class="bg-panel p-5">
        <dt class="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">${k}</dt>
        <dd class="mt-1.5 font-display font-bold">${v}</dd>
      </div>`,
    )
    .join("");

  const galleryHtml = project.gallery
    .map(
      (g, i) => `
      <div class="overflow-hidden rounded-3xl border border-line ${i === 0 ? "sm:row-span-2" : ""}">
        <img src="${g}" alt="${project.title} — imagem ${i + 1}" loading="lazy" class="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
      </div>`,
    )
    .join("");

  const metricsHtml = project.metrics
    .map(
      (m) => `
      <div class="bg-panel p-8">
        <div class="font-display text-5xl font-black text-red">${m.k}</div>
        <div class="mt-2 text-sm text-mist">${m.v}</div>
      </div>`,
    )
    .join("");

  return `
  <div class="entrada-pagina pt-28">
    <div class="mx-auto max-w-6xl px-5 sm:px-8">
      <button data-back-to-work class="group mb-10 inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-white">
        <span class="transition-transform group-hover:-translate-x-1">←</span> Voltar aos projetos
      </button>

      ${Sobrancelha(`Projeto ${project.index}`)}
      <h1 class="mt-4 font-display text-6xl font-black leading-[0.9] sm:text-8xl">${project.title}</h1>
      <p class="mt-6 max-w-2xl text-xl leading-relaxed text-mist">${project.summary}</p>

      <dl class="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-4">${metaHtml}</dl>
    </div>

    <div class="mx-auto mt-12 max-w-[1400px] px-5 sm:px-8">
      <div class="relative aspect-[16/9] overflow-hidden rounded-3xl border border-line">
        <img data-parallax="0.08" src="${project.cover}" alt="${project.title}" class="absolute inset-0 h-[120%] w-full object-cover" />
      </div>
    </div>

    <div class="mx-auto max-w-6xl px-5 pt-16 sm:px-8">
      ${Bloco("Context", project.context)}
      ${Bloco("Challenge", project.challenge)}
      ${Bloco("Concept", project.concept)}

      <div class="revelar grid gap-4 border-t border-line py-12 sm:grid-cols-2">${galleryHtml}</div>

      ${Bloco("Process", project.process)}

      <div class="revelar border-t border-line py-12">
        <div class="mb-6 font-mono text-[11px] uppercase tracking-[0.28em] text-red">Before / After</div>
        ${renderizarAntesDepois(project)}
        <p class="mt-3 font-mono text-xs text-mist">Arraste para comparar o antes e o depois.</p>
      </div>

      ${Bloco("Result", project.result)}

      <div class="revelar grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">${metricsHtml}</div>
    </div>

    <button data-open-project="${next.slug}" data-cursor="Abrir" class="group relative mt-20 block w-full overflow-hidden border-t border-line">
      <img src="${next.cover}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-25 transition-all duration-700 group-hover:scale-105 group-hover:opacity-40" />
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="relative mx-auto flex max-w-6xl flex-col items-start gap-2 px-5 py-20 sm:px-8 sm:py-28">
        <span class="font-mono text-[11px] uppercase tracking-[0.28em] text-red">Próximo projeto →</span>
        <span class="font-display text-5xl font-black transition-transform duration-500 group-hover:translate-x-2 sm:text-8xl">${next.title}</span>
        <span class="font-mono text-xs text-mist">${next.category}</span>
      </div>
    </button>
  </div>`;
}

/* ==================================================================== */
/* Reveal / parallax / scrollspy / scroll-progress (hooks.ts ports)      */
/* ==================================================================== */

let observadorRevelacao = null;
function inicializarRevelacao() {
  if (observadorRevelacao) observadorRevelacao.disconnect();
  observadorRevelacao = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visivel");
          observadorRevelacao.unobserve(e.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
  );
  document.querySelectorAll(".revelar:not(.visivel)").forEach((el) => observadorRevelacao.observe(el));
}

function inicializarParalaxe() {
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    if (el.dataset.parallaxBound) return;
    el.dataset.parallaxBound = "1";
    const speed = parseFloat(el.dataset.parallax);
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.transform = `translate3d(0, ${(-offset * speed).toFixed(1)}px, 0)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  });
}

let observadorEspiaoRolagem = null;
function inicializarEspiaoRolagem() {
  if (observadorEspiaoRolagem) observadorEspiaoRolagem.disconnect();
  if (!emHome()) return;
  const ids = NAVEGACAO.map((n) => n.id);
  const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
  observadorEspiaoRolagem = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          secaoAtiva = e.target.id;
          const navEl = document.getElementById("navbar");
          if (navEl) navEl.innerHTML = renderizarNavegacao();
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
  );
  sections.forEach((s) => observadorEspiaoRolagem.observe(s));
}

function inicializarProgressoRolagem() {
  const bar = document.getElementById("scroll-progress-bar");
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? h.scrollTop / max : 0;
    if (bar) bar.style.width = `${p * 100}%`;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function inicializarEstadoRolagemNavegacao() {
  const onScroll = () => {
    const next = window.scrollY > 24;
    if (next !== navRolada) {
      navRolada = next;
      document.getElementById("navbar").innerHTML = renderizarNavegacao();
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ==================================================================== */
/* Custom cursor                                                         */
/* ==================================================================== */

function inicializarCursor() {
  const dot = document.getElementById("cursor-dot");
  const inner = document.getElementById("cursor-inner");
  const label = document.getElementById("cursor-label");
  if (window.matchMedia("(pointer: coarse)").matches) return;
  document.documentElement.classList.add("ocultar-cursor");

  let x = 0,
    y = 0,
    cx = 0,
    cy = 0;
  const loop = () => {
    cx += (x - cx) * 0.2;
    cy += (y - cy) * 0.2;
    dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const modeClasses = {
    label: "h-14 w-14 grid place-items-center bg-red text-white text-[10px] font-semibold uppercase tracking-wider",
    carousel: "h-10 w-10 grid place-items-center bg-red text-white text-base",
    interactive: "h-2 w-2 bg-red",
    default: "h-2.5 w-2.5 bg-white mix-blend-difference",
  };

  window.addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
    dot.style.opacity = "1";
    const target = e.target.closest("a, button, input, textarea, select, label, [role='button'], [data-cursor]");
    let mode = "default";
    let text = "";
    if (target) {
      const raw = target.dataset.cursor;
      if (raw === "carousel") mode = "carousel";
      else if (raw && raw.trim()) {
        mode = "label";
        text = raw;
      } else mode = "interactive";
    }
    inner.className = `-translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,background-color,color] duration-300 ease-out ${modeClasses[mode]}`;
    label.textContent = mode === "carousel" ? "→" : mode === "label" ? text : "";
    label.className = `text-center leading-none transition-opacity duration-200 ${mode === "label" || mode === "carousel" ? "opacity-100" : "opacity-0"}`;
  });
  document.addEventListener("mouseleave", () => {
    dot.style.opacity = "0";
  });
}

/* ==================================================================== */
/* Before/After drag slider                                              */
/* ==================================================================== */

function vincularAntesDepois() {
  const container = document.getElementById("before-after");
  if (!container) return;
  const wrap = document.getElementById("ba-before-wrap");
  const img = document.getElementById("ba-before-img");
  const handle = document.getElementById("ba-handle");
  let dragging = false;

  const move = (clientX) => {
    const rect = container.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    posicaoComparacao = Math.min(100, Math.max(0, pct));
    wrap.style.width = `${posicaoComparacao}%`;
    img.style.width = `${container.clientWidth}px`;
    handle.style.left = `${posicaoComparacao}%`;
  };

  img.style.width = `${container.clientWidth}px`;

  container.addEventListener("pointerdown", (e) => {
    dragging = true;
    container.setPointerCapture(e.pointerId);
    move(e.clientX);
  });
  container.addEventListener("pointermove", (e) => {
    if (dragging) move(e.clientX);
  });
  container.addEventListener("pointerup", () => {
    dragging = false;
  });
}

/* ==================================================================== */
/* Event delegation                                                      */
/* ==================================================================== */

document.addEventListener("click", (e) => {
  const themeToggle = e.target.closest("[data-theme-toggle]");
  if (themeToggle) {
    modoClaro = !modoClaro;
    aplicarTema();
    renderizarApp();
    return;
  }
  const navBtn = e.target.closest("[data-nav]");
  if (navBtn) {
    irParaSecao(navBtn.dataset.nav);
    return;
  }
  const openBtn = e.target.closest("[data-open-project]");
  if (openBtn) {
    abrirProjeto(openBtn.dataset.abrirProjeto);
    return;
  }
  const backBtn = e.target.closest("[data-back-to-work]");
  if (backBtn) {
    voltarParaProjetos();
    return;
  }
  const menuToggle = e.target.closest("[data-toggle-menu]");
  if (menuToggle) {
    menuMovelAberto = !menuMovelAberto;
    document.getElementById("navbar").innerHTML = renderizarNavegacao();
    return;
  }
  const copyEmail = e.target.closest("[data-copy-email]");
  if (copyEmail) {
    if (navigator.clipboard) {
      e.preventDefault();
      navigator.clipboard.writeText(PERFIL.email).then(() => {
        emailCopiado = true;
        document.getElementById("email-link").innerHTML = renderizarLinkEmail();
        setTimeout(() => {
          emailCopiado = false;
          const elc = document.getElementById("email-link");
          if (elc) elc.innerHTML = renderizarLinkEmail();
        }, 1800);
      });
    }
    return;
  }
  const deckPrev = e.target.closest("[data-deck-prev]");
  if (deckPrev) {
    indiceCarrossel = (indiceCarrossel - 1 + APRESENTACAO.slides.length) % APRESENTACAO.slides.length;
    atualizarApresentacao();
    return;
  }
  const deckNext = e.target.closest("[data-deck-next]");
  if (deckNext) {
    indiceCarrossel = (indiceCarrossel + 1) % APRESENTACAO.slides.length;
    atualizarApresentacao();
    return;
  }
  const deckGoto = e.target.closest("[data-deck-goto]");
  if (deckGoto) {
    indiceCarrossel = parseInt(deckGoto.dataset.deckGoto, 10);
    atualizarApresentacao();
    return;
  }
});

function atualizarApresentacao() {
  const c = document.getElementById("deck-container");
  if (c) c.innerHTML = renderizarApresentacaoSlides();
}

document.addEventListener("keydown", (e) => {
  const stage = document.getElementById("deck-stage");
  if (!stage || document.activeElement !== stage) return;
  if (e.key === "ArrowRight") {
    indiceCarrossel = (indiceCarrossel + 1) % APRESENTACAO.slides.length;
    atualizarApresentacao();
  }
  if (e.key === "ArrowLeft") {
    indiceCarrossel = (indiceCarrossel - 1 + APRESENTACAO.slides.length) % APRESENTACAO.slides.length;
    atualizarApresentacao();
  }
});

let toqueXApresentacao = null;
document.addEventListener("touchstart", (e) => {
  const stage = e.target.closest("#deck-stage");
  if (stage) toqueXApresentacao = e.touches[0].clientX;
});
document.addEventListener("touchend", (e) => {
  if (toqueXApresentacao === null) return;
  const stage = e.target.closest("#deck-stage");
  if (stage) {
    const dx = e.changedTouches[0].clientX - toqueXApresentacao;
    if (Math.abs(dx) > 40) {
      indiceCarrossel = dx < 0 ? (indiceCarrossel + 1) % APRESENTACAO.slides.length : (indiceCarrossel - 1 + APRESENTACAO.slides.length) % APRESENTACAO.slides.length;
      atualizarApresentacao();
    }
  }
  toqueXApresentacao = null;
});

/* ==================================================================== */
/* SEÇÃO 9 — CONTATO                                                    */
/* Validação e envio do formulário de contato.                          */
/* ==================================================================== */

function validarContato() {
  const errosContatoAtual = {};
  const emailInformado = valoresContato.email.trim();

  // ----------------------------------------------------------
  // VALIDAÇÃO DO NOME
  // ----------------------------------------------------------

  if (valoresContato.name.trim().length < 2) {
    errosContatoAtual.name = "Informe seu nome.";
  }

  // ----------------------------------------------------------
  // VALIDAÇÃO DO E-MAIL
  // ----------------------------------------------------------

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInformado)) {
    errosContatoAtual.email = "Informe um e-mail válido.";
  }

  // ----------------------------------------------------------
  // VALIDAÇÃO DO ASSUNTO
  // ----------------------------------------------------------

  if (valoresContato.subject.trim().length < 2) {
    errosContatoAtual.subject = "Informe o assunto.";
  }

  // ----------------------------------------------------------
  // VALIDAÇÃO DA MENSAGEM
  // ----------------------------------------------------------

  if (valoresContato.message.trim().length < 10) {
    errosContatoAtual.message = "Conte um pouco mais (mín. 10 caracteres).";
  }

  return errosContatoAtual;
}

/* ==================================================================== */
/* SEÇÃO 9.1 — SALVAR CONTATO NO SUPABASE                              */
/* Envia os dados validados para a tabela "contatos".                   */
/* ==================================================================== */

async function salvarContatoNoSupabase() {
  const { error: erroSupabase } = await bancoDeContatos
    .from("contatos")
    .insert({
      nome: valoresContato.name.trim(),
      email: valoresContato.email.trim().toLowerCase(),
      assunto: valoresContato.subject.trim(),
      mensagem: valoresContato.message.trim()
    });

  if (erroSupabase) {
    console.error("Erro ao salvar contato no Supabase:", erroSupabase);
    return false;
  }

  return true;
}

/* ==================================================================== */
/* SEÇÃO 9.2 — LIGAÇÃO DO FORMULÁRIO                                   */
/* Captura os dados e envia para o Supabase.                            */
/* ==================================================================== */

function vincularFormularioContato() {
  const formularioContato = document.getElementById("contact-form");

  if (!formularioContato) {
    return;
  }

  const camposFormulario = ["name", "email", "subject", "message"];

  camposFormulario.forEach((campoFormulario) => {
    const campo = formularioContato.querySelector(`#${campoFormulario}`);

    if (!campo) {
      return;
    }

    campo.addEventListener("input", (evento) => {
      valoresContato[campoFormulario] = evento.target.value;

      if (
        estadoContato === "idle" ||
        estadoContato === "error" ||
        estadoContato === "success"
      ) {
        estadoContato = "typing";
      }

      errosContato[campoFormulario] = "";
    });
  });

  formularioContato.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    // ----------------------------------------------------------
    // 1. VALIDAR OS DADOS
    // ----------------------------------------------------------

    errosContato = validarContato();

    if (Object.keys(errosContato).length > 0) {
      estadoContato = "error";
      atualizarFormularioContato();
      return;
    }

    // ----------------------------------------------------------
    // 2. MOSTRAR ESTADO DE ENVIO
    // ----------------------------------------------------------

    estadoContato = "submitting";
    atualizarFormularioContato();

    // ----------------------------------------------------------
    // 3. SALVAR NO SUPABASE
    // ----------------------------------------------------------

    const contatoFoiSalvo = await salvarContatoNoSupabase();

    // ----------------------------------------------------------
    // 4. TRATAR ERRO
    // ----------------------------------------------------------

    if (!contatoFoiSalvo) {
      errosContato = {
        message: "Não foi possível enviar sua mensagem. Tente novamente."
      };

      estadoContato = "error";
      atualizarFormularioContato();
      return;
    }

    // ----------------------------------------------------------
    // 5. SUCESSO
    // ----------------------------------------------------------

    estadoContato = "success";

    valoresContato = {
      name: "",
      email: "",
      subject: "",
      message: ""
    };

    errosContato = {};

    atualizarFormularioContato();
  });
}

/* ==================================================================== */
/* SEÇÃO 9.3 — ATUALIZAÇÃO DO FORMULÁRIO                               */
/* Recria somente o conteúdo do formulário após cada estado.           */
/* ==================================================================== */

function atualizarFormularioContato() {
  const containerFormulario = document.getElementById("contact-form-container");

  if (containerFormulario) {
    containerFormulario.innerHTML = renderizarFormularioContato();
    vincularFormularioContato();
  }
}

/* ==================================================================== */
/* Root render                                                           */
/* ==================================================================== */

function renderizarApp() {
  aplicarTema();
  document.getElementById("navbar").innerHTML = renderizarNavegacao();
  document.getElementById("main-content").innerHTML = emHome() || !projetoAtual() ? renderizarPaginaInicial() : renderizarDetalheProjeto(projetoAtual());
  document.getElementById("footer-inner").innerHTML = renderizarRodape();

  inicializarRevelacao();
  inicializarParalaxe();
  inicializarEspiaoRolagem();
  vincularAntesDepois();
  vincularFormularioContato();

  if (visao.name === "project") window.scrollTo({ top: 0, behavior: "instant" });
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarTema();
  inicializarProgressoRolagem();
  inicializarEstadoRolagemNavegacao();
  inicializarCursor();
  renderizarApp();
});
