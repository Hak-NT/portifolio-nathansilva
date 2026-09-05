// ===============================================================
// SEÇÃO 1 — VERIFICAÇÃO DO FORMULÁRIO DE CONTATO
// ===============================================================
// Mantém a aparência atual do formulário e adiciona a confirmação
// de e-mail antes de permitir o salvamento do contato.
// ===============================================================

(() => {
  const estadoVerificacao = {
    etapa: "formulario",
    dados: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    codigo: "",
    erro: "",
    processando: false,
  };

  // =============================================================
  // SEÇÃO 2 — UTILITÁRIOS
  // =============================================================

  function escaparHtmlFormulario(textoOriginal) {
    return String(textoOriginal)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function obterContainerContato() {
    return document.getElementById("contact-form-container");
  }

  function mascararEmail(emailInformado) {
    const partesEmail = String(emailInformado).split("@");
    if (partesEmail.length !== 2) return emailInformado;

    const nomeEmail = partesEmail[0];
    const dominioEmail = partesEmail[1];

    if (nomeEmail.length <= 1) return `*@${dominioEmail}`;
    return `${nomeEmail[0]}***@${dominioEmail}`;
  }

  function validarDadosContato(dadosContato) {
    const erros = {};

    if (dadosContato.name.trim().length < 2) {
      erros.name = "Informe seu nome.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dadosContato.email.trim())) {
      erros.email = "Informe um e-mail válido.";
    }

    if (dadosContato.subject.trim().length < 2) {
      erros.subject = "Informe o assunto.";
    }

    if (dadosContato.message.trim().length < 10) {
      erros.message = "Conte um pouco mais (mín. 10 caracteres).";
    }

    return erros;
  }

  function mostrarErroFormulario(mensagem) {
    const formulario = document.getElementById("contact-form");
    if (!formulario) return;

    let aviso = formulario.querySelector("[data-verificacao-erro]");

    if (!aviso) {
      aviso = document.createElement("p");
      aviso.dataset.verificacaoErro = "true";
      aviso.setAttribute("role", "alert");
      aviso.className = "mt-3 text-sm text-red";
      formulario.querySelector("div.flex")?.appendChild(aviso);
    }

    if (aviso) aviso.textContent = mensagem;
  }

  // =============================================================
  // SEÇÃO 3 — CHAMADA DA EDGE FUNCTION
  // =============================================================

  async function enviarCodigoVerificacao() {
    try {
      const { data, error } = await bancoDeContatos.functions.invoke(
        "verificar-email",
        {
          body: {
            etapa: "enviar",
            nome: estadoVerificacao.dados.name.trim(),
            email: estadoVerificacao.dados.email.trim().toLowerCase(),
            assunto: estadoVerificacao.dados.subject.trim(),
            mensagem: estadoVerificacao.dados.message.trim(),
          },
        },
      );

      if (error) {
        console.error("Erro ao solicitar código de verificação:", error);
        estadoVerificacao.erro = "Não foi possível enviar o código. Tente novamente.";
        return false;
      }

      if (!data?.sucesso) {
        estadoVerificacao.erro = data?.mensagem || "Não foi possível enviar o código.";
        return false;
      }

      estadoVerificacao.erro = "";
      return true;
    } catch (erro) {
      console.error("Erro inesperado ao solicitar código:", erro);
      estadoVerificacao.erro = "Não foi possível enviar o código. Tente novamente.";
      return false;
    }
  }

  async function confirmarCodigoVerificacao(codigoInformado) {
    try {
      const { data, error } = await bancoDeContatos.functions.invoke(
        "verificar-email",
        {
          body: {
            etapa: "confirmar",
            email: estadoVerificacao.dados.email.trim().toLowerCase(),
            codigo: codigoInformado.trim(),
          },
        },
      );

      if (error) {
        console.error("Erro ao confirmar código:", error);
        estadoVerificacao.erro = "Não foi possível confirmar o código. Tente novamente.";
        return false;
      }

      if (!data?.sucesso) {
        estadoVerificacao.erro = data?.mensagem || "Código incorreto.";
        return false;
      }

      estadoVerificacao.erro = "";
      return true;
    } catch (erro) {
      console.error("Erro inesperado ao confirmar código:", erro);
      estadoVerificacao.erro = "Não foi possível confirmar o código. Tente novamente.";
      return false;
    }
  }

  // =============================================================
  // SEÇÃO 4 — TELA DE CONFIRMAÇÃO
  // =============================================================

  function renderizarConfirmacao() {
    const container = obterContainerContato();
    if (!container) return;

    const bloqueado = estadoVerificacao.processando;
    const reenviando = estadoVerificacao.etapa === "reenviando";
    const erroSeguro = escaparHtmlFormulario(estadoVerificacao.erro || "");
    const emailSeguro = escaparHtmlFormulario(
      mascararEmail(estadoVerificacao.dados.email),
    );

    container.innerHTML = `
      <form id="contact-verification-form" novalidate class="revelar space-y-5" aria-label="Confirmação de e-mail">
        <div class="rounded-3xl border border-line bg-panel p-6 sm:p-8">
          <div class="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">Confirmação</div>
          <h3 class="mt-3 font-display text-2xl font-bold">Confirme seu e-mail</h3>
          <p class="mt-3 text-sm leading-relaxed text-mist">
            Enviamos um código de 6 dígitos para <span class="text-white">${emailSeguro}</span>.
          </p>

          <label for="codigo-verificacao" class="mt-6 mb-1.5 block font-mono text-[11px] uppercase tracking-[0.2em] text-mist">Código</label>
          <input
            id="codigo-verificacao"
            name="codigo-verificacao"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            pattern="[0-9]{6}"
            placeholder="000000"
            ${bloqueado ? "disabled" : ""}
            class="w-full rounded-2xl border border-line bg-panel px-4 py-3.5 text-center font-mono text-2xl tracking-[0.35em] text-white outline-none transition-all focus:border-red focus:ring-2 focus:ring-red/30 disabled:opacity-60"
            aria-invalid="${!!estadoVerificacao.erro}"
          />
          <p class="mt-2 text-xs text-mist">O código é válido por 10 minutos.</p>
          ${erroSeguro ? `<p role="alert" class="mt-3 text-sm text-red">${erroSeguro}</p>` : ""}

          <div class="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" ${bloqueado ? "disabled" : ""}
              class="group inline-flex items-center gap-3 rounded-full bg-red px-7 py-3.5 font-display font-semibold text-white transition-all duration-300 hover:gap-4 disabled:opacity-60">
              ${bloqueado ? `<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>Confirmando…` : `Confirmar e enviar<span class="grid h-6 w-6 place-items-center rounded-full bg-white/25">↗</span>`}
            </button>
            <button type="button" data-reenviar-codigo ${bloqueado || reenviando ? "disabled" : ""}
              class="rounded-full border border-line px-5 py-3.5 font-display text-sm font-semibold text-white transition-colors hover:border-red hover:text-red disabled:opacity-60">
              ${reenviando ? "Reenviando…" : "Reenviar código"}
            </button>
          </div>
        </div>
      </form>`;

    document.getElementById("codigo-verificacao")?.focus();
    vincularConfirmacao();
  }

  // =============================================================
  // SEÇÃO 5 — FLUXO DE CONFIRMAÇÃO
  // =============================================================

  function vincularConfirmacao() {
    const formulario = document.getElementById("contact-verification-form");
    if (!formulario) return;

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      evento.stopImmediatePropagation();

      const campoCodigo = document.getElementById("codigo-verificacao");
      const codigoInformado = campoCodigo?.value.trim() || "";

      if (!/^\d{6}$/.test(codigoInformado)) {
        estadoVerificacao.erro = "Digite o código de 6 dígitos.";
        renderizarConfirmacao();
        return;
      }

      estadoVerificacao.processando = true;
      estadoVerificacao.erro = "";
      renderizarConfirmacao();

      const confirmado = await confirmarCodigoVerificacao(codigoInformado);

      if (!confirmado) {
        estadoVerificacao.processando = false;
        renderizarConfirmacao();
        return;
      }

      estadoVerificacao.etapa = "sucesso";
      estadoVerificacao.processando = false;
      renderizarSucesso();
    }, true);

    document.querySelector("[data-reenviar-codigo]")?.addEventListener("click", async (evento) => {
      evento.preventDefault();
      evento.stopImmediatePropagation();

      estadoVerificacao.etapa = "reenviando";
      estadoVerificacao.processando = true;
      estadoVerificacao.erro = "";
      renderizarConfirmacao();

      const enviado = await enviarCodigoVerificacao();
      estadoVerificacao.processando = false;
      estadoVerificacao.etapa = "aguardando";

      if (!enviado) {
        renderizarConfirmacao();
        return;
      }

      renderizarConfirmacao();
    }, true);
  }

  function renderizarSucesso() {
    const container = obterContainerContato();
    if (!container) return;

    container.innerHTML = `
      <div class="revelar rounded-3xl border border-line bg-panel p-6 sm:p-8" role="status">
        <div class="flex items-center gap-3 text-sm text-green-400">
          <span class="grid h-6 w-6 place-items-center rounded-full bg-green-500 text-xs text-black">✓</span>
          Mensagem enviada — retorno em até 24h.
        </div>
        <button type="button" data-nova-mensagem class="mt-6 rounded-full border border-line px-5 py-3 font-display text-sm font-semibold text-white transition-colors hover:border-red hover:text-red">
          Enviar outra mensagem
        </button>
      </div>`;

    document.querySelector("[data-nova-mensagem]")?.addEventListener("click", () => {
      estadoVerificacao.etapa = "formulario";
      estadoVerificacao.dados = { name: "", email: "", subject: "", message: "" };
      estadoVerificacao.erro = "";
      estadoVerificacao.codigo = "";

      if (typeof renderizarApp === "function") {
        renderizarApp();
      }
    });
  }

  // =============================================================
  // SEÇÃO 6 — INTERCEPTAÇÃO DO ENVIO ORIGINAL
  // =============================================================

  document.addEventListener("input", (evento) => {
    const campo = evento.target;
    if (!campo?.closest?.("#contact-form")) return;

    if (Object.prototype.hasOwnProperty.call(estadoVerificacao.dados, campo.name)) {
      estadoVerificacao.dados[campo.name] = campo.value;
    }
  }, true);

  document.addEventListener("submit", async (evento) => {
    const formulario = evento.target;
    if (!(formulario instanceof HTMLFormElement) || formulario.id !== "contact-form") {
      return;
    }

    const dadosContato = {
      name: formulario.elements.name?.value || "",
      email: formulario.elements.email?.value || "",
      subject: formulario.elements.subject?.value || "",
      message: formulario.elements.message?.value || "",
    };

    const erros = validarDadosContato(dadosContato);

    // Deixa a validação original do app.js cuidar de formulários inválidos.
    if (Object.keys(erros).length > 0) {
      return;
    }

    evento.preventDefault();
    evento.stopImmediatePropagation();

    estadoVerificacao.dados = dadosContato;
    estadoVerificacao.etapa = "enviando";
    estadoVerificacao.processando = true;
    estadoVerificacao.erro = "";

    const botaoEnviar = formulario.querySelector('button[type="submit"]');
    if (botaoEnviar) {
      botaoEnviar.disabled = true;
      botaoEnviar.setAttribute("aria-busy", "true");
    }

    const enviado = await enviarCodigoVerificacao();

    estadoVerificacao.processando = false;

    if (!enviado) {
      mostrarErroFormulario(estadoVerificacao.erro);
      const botao = document.querySelector('#contact-form button[type="submit"]');
      if (botao) {
        botao.disabled = false;
        botao.removeAttribute("aria-busy");
      }
      estadoVerificacao.etapa = "formulario";
      return;
    }

    estadoVerificacao.etapa = "aguardando";
    renderizarConfirmacao();
  }, true);

  // =============================================================
  // SEÇÃO 7 — COMPATIBILIDADE COM RE-RENDERS DO APP
  // =============================================================

  const container = obterContainerContato();
  if (container) {
    const observador = new MutationObserver(() => {
      if (estadoVerificacao.etapa === "aguardando" || estadoVerificacao.etapa === "reenviando") {
        if (!document.getElementById("contact-verification-form")) {
          renderizarConfirmacao();
        }
      }
    });

    observador.observe(container, { childList: true });
  }
})();
