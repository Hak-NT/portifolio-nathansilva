// ===============================================================
// EDGE FUNCTION: VERIFICAR E-MAIL
// ===============================================================
// Responsável por validar o formulário, enviar o código de
// confirmação pelo Resend e, após a confirmação, salvar o contato.
//
// IMPORTANTE:
// - Esta função roda no Supabase Edge Runtime (Deno).
// - Nenhuma chave secreta deve aparecer no frontend.
// - O segredo do Resend utilizado aqui é API_RESEND.
// - O service role do Supabase permanece somente no servidor.
// ===============================================================

// ===============================================================
// SEÇÃO 1 — IMPORTAÇÃO
// ===============================================================

import { createClient } from "@supabase/supabase-js";

// ===============================================================
// SEÇÃO 2 — CONFIGURAÇÕES E SECRETS
// ===============================================================

const enderecoSupabase = Deno.env.get("SUPABASE_URL") ?? "";
const chaveServico = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const chaveResend = Deno.env.get("API_RESEND") ?? "";
const emailDono = Deno.env.get("EMAIL_DESTINO") ?? "";
const remetenteEmail = Deno.env.get("REMETENTE_EMAIL") ?? "onboarding@resend.dev";

const bancoServico = createClient(enderecoSupabase, chaveServico);

// ===============================================================
// SEÇÃO 3 — CORS
// ===============================================================

const CABECALHOS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ===============================================================
// SEÇÃO 4 — RESPOSTAS
// ===============================================================

function respostaJson(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: {
      ...CABECALHOS_CORS,
      "Content-Type": "application/json",
    },
  });
}

// ===============================================================
// SEÇÃO 5 — VALIDAÇÕES E UTILITÁRIOS
// ===============================================================

function validarEmail(emailInformado: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInformado);
}

function gerarCodigoVerificacao(): string {
  const bytesAleatorios = new Uint32Array(1);
  crypto.getRandomValues(bytesAleatorios);
  return String(bytesAleatorios[0] % 1000000).padStart(6, "0");
}

async function gerarHashCodigo(codigo: string): Promise<string> {
  const dadosCodigo = new TextEncoder().encode(codigo);
  const resultadoHash = await crypto.subtle.digest("SHA-256", dadosCodigo);
  return Array.from(new Uint8Array(resultadoHash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function escaparHtml(textoOriginal: string): string {
  return textoOriginal
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ===============================================================
// SEÇÃO 6 — ENVIO PELO RESEND
// ===============================================================

async function enviarEmailComResend(
  destino: string,
  assunto: string,
  html: string,
  replyTo?: string,
): Promise<void> {
  if (!chaveResend) {
    throw new Error("API_RESEND não está configurada.");
  }

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chaveResend}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Portfólio <${remetenteEmail}>`,
      to: [destino],
      subject: assunto,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!resposta.ok) {
    const detalhesErro = await resposta.text();
    throw new Error(`Falha ao enviar e-mail pelo Resend: ${detalhesErro}`);
  }
}

// ===============================================================
// SEÇÃO 7 — ENVIO DO CÓDIGO
// ===============================================================

async function processarEnvioCodigo(
  nome: string,
  email: string,
  assunto: string,
  mensagem: string,
): Promise<Response> {
  if (
    nome.length < 2 ||
    nome.length > 120 ||
    !validarEmail(email) ||
    email.length > 254 ||
    assunto.length < 2 ||
    assunto.length > 160 ||
    mensagem.length < 10 ||
    mensagem.length > 5000
  ) {
    return respostaJson({
      sucesso: false,
      mensagem: "Dados inválidos.",
    }, 400);
  }

  // Limite de solicitações por e-mail na última hora.
  const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count: totalRecente, error: erroContagem } = await bancoServico
    .from("verificacoes_email")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("criado_em", umaHoraAtras);

  if (erroContagem) {
    console.error("Erro ao verificar limite de solicitações:", erroContagem);
    return respostaJson({
      sucesso: false,
      mensagem: "Não foi possível iniciar a verificação agora.",
    }, 500);
  }

  if ((totalRecente ?? 0) >= 5) {
    return respostaJson({
      sucesso: false,
      mensagem: "Limite de solicitações atingido. Tente novamente mais tarde.",
    }, 429);
  }

  // Impede reenvio imediato do código.
  const sessentaSegundosAtras = new Date(Date.now() - 60 * 1000).toISOString();

  const { data: envioRecente, error: erroEnvioRecente } = await bancoServico
    .from("verificacoes_email")
    .select("id, criado_em")
    .eq("email", email)
    .gte("criado_em", sessentaSegundosAtras)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (erroEnvioRecente) {
    console.error("Erro ao verificar intervalo de envio:", erroEnvioRecente);
    return respostaJson({
      sucesso: false,
      mensagem: "Não foi possível iniciar a verificação agora.",
    }, 500);
  }

  if (envioRecente) {
    return respostaJson({
      sucesso: false,
      mensagem: "Aguarde alguns segundos antes de solicitar outro código.",
    }, 429);
  }

  // Invalida códigos pendentes anteriores do mesmo e-mail.
  const { error: erroInvalidacao } = await bancoServico
    .from("verificacoes_email")
    .update({ expira_em: new Date(0).toISOString() })
    .eq("email", email)
    .is("verificado_em", null);

  if (erroInvalidacao) {
    console.error("Erro ao invalidar códigos anteriores:", erroInvalidacao);
    return respostaJson({
      sucesso: false,
      mensagem: "Não foi possível iniciar a verificação agora.",
    }, 500);
  }

  const codigo = gerarCodigoVerificacao();
  const codigoHash = await gerarHashCodigo(codigo);
  const expiracao = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: erroInsercao } = await bancoServico
    .from("verificacoes_email")
    .insert({
      email,
      codigo_hash: codigoHash,
      nome,
      assunto,
      mensagem,
      expira_em: expiracao,
      verificado_em: null,
      tentativas: 0,
    });

  if (erroInsercao) {
    console.error("Erro ao salvar verificação:", erroInsercao);
    return respostaJson({
      sucesso: false,
      mensagem: "Não foi possível iniciar a verificação agora.",
    }, 500);
  }

  const nomeSeguro = escaparHtml(nome);
  const codigoSeguro = escaparHtml(codigo);

  const htmlCodigo = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:600px;margin:auto">
      <h2>Confirme seu e-mail</h2>
      <p>Olá, ${nomeSeguro}.</p>
      <p>Use o código abaixo para confirmar o envio da sua mensagem:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px">${codigoSeguro}</p>
      <p>O código expira em 10 minutos.</p>
      <p>Se você não solicitou este código, ignore este e-mail.</p>
    </div>
  `;

  try {
    await enviarEmailComResend(
      email,
      "Código de confirmação — Portfólio",
      htmlCodigo,
    );
  } catch (erro) {
    console.error("Erro ao enviar código pelo Resend:", erro);

    // Evita deixar um código utilizável caso o envio tenha falhado.
    await bancoServico
      .from("verificacoes_email")
      .update({ expira_em: new Date(0).toISOString() })
      .eq("email", email)
      .eq("codigo_hash", codigoHash);

    return respostaJson({
      sucesso: false,
      mensagem: "Não foi possível enviar o código de confirmação.",
    }, 502);
  }

  return respostaJson({
    sucesso: true,
    mensagem: "Código de confirmação enviado.",
  });
}

// ===============================================================
// SEÇÃO 8 — CONFIRMAÇÃO DO CÓDIGO
// ===============================================================

async function processarConfirmacaoCodigo(
  email: string,
  codigo: string,
): Promise<Response> {
  if (!validarEmail(email) || !/^\d{6}$/.test(codigo)) {
    return respostaJson({
      sucesso: false,
      mensagem: "Código inválido.",
    }, 400);
  }

  const { data: verificacao, error: erroBusca } = await bancoServico
    .from("verificacoes_email")
    .select("*")
    .eq("email", email)
    .is("verificado_em", null)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (erroBusca) {
    console.error("Erro ao buscar verificação:", erroBusca);
    return respostaJson({
      sucesso: false,
      mensagem: "Não foi possível validar o código agora.",
    }, 500);
  }

  if (!verificacao) {
    return respostaJson({
      sucesso: false,
      mensagem: "Código não encontrado ou já utilizado.",
    }, 400);
  }

  if (new Date(verificacao.expira_em).getTime() <= Date.now()) {
    return respostaJson({
      sucesso: false,
      mensagem: "O código expirou. Solicite um novo código.",
    }, 400);
  }

  const tentativasAtuais = Number(verificacao.tentativas ?? 0);

  if (tentativasAtuais >= 5) {
    return respostaJson({
      sucesso: false,
      mensagem: "Número máximo de tentativas atingido. Solicite um novo código.",
    }, 429);
  }

  const codigoHash = await gerarHashCodigo(codigo);

  if (codigoHash !== verificacao.codigo_hash) {
    const { error: erroTentativa } = await bancoServico
      .from("verificacoes_email")
      .update({ tentativas: tentativasAtuais + 1 })
      .eq("id", verificacao.id);

    if (erroTentativa) {
      console.error("Erro ao registrar tentativa:", erroTentativa);
    }

    return respostaJson({
      sucesso: false,
      mensagem: "Código incorreto.",
    }, 400);
  }

  // =============================================================
  // SEÇÃO 8.1 — PROTEÇÃO CONTRA DUPLICIDADE
  // =============================================================

  const quinzeMinutosAtras = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: contatoExistente, error: erroDuplicidade } = await bancoServico
    .from("contatos")
    .select("id")
    .eq("email", verificacao.email)
    .eq("assunto", verificacao.assunto)
    .eq("mensagem", verificacao.mensagem)
    .gte("criado_em", quinzeMinutosAtras)
    .limit(1)
    .maybeSingle();

  if (erroDuplicidade) {
    console.error("Erro ao verificar contato duplicado:", erroDuplicidade);
    return respostaJson({
      sucesso: false,
      mensagem: "Não foi possível concluir o envio agora.",
    }, 500);
  }

  let idContato: string | null = contatoExistente?.id ?? null;

  if (!idContato) {
    const { data: contatoCriado, error: erroContato } = await bancoServico
      .from("contatos")
      .insert({
        nome: verificacao.nome,
        email: verificacao.email,
        assunto: verificacao.assunto,
        mensagem: verificacao.mensagem,
      })
      .select("id")
      .single();

    if (erroContato) {
      console.error("Erro ao salvar contato:", erroContato);
      return respostaJson({
        sucesso: false,
        mensagem: "Não foi possível salvar sua mensagem agora.",
      }, 500);
    }

    idContato = contatoCriado.id;
  }

  const { error: erroVerificacao } = await bancoServico
    .from("verificacoes_email")
    .update({ verificado_em: new Date().toISOString() })
    .eq("id", verificacao.id);

  if (erroVerificacao) {
    console.error("Erro ao marcar verificação:", erroVerificacao);
    return respostaJson({
      sucesso: false,
      mensagem: "Não foi possível concluir a confirmação agora.",
    }, 500);
  }

  // =============================================================
  // SEÇÃO 8.2 — NOTIFICAÇÃO DO DONO
  // =============================================================

  if (emailDono) {
    const nomeSeguro = escaparHtml(verificacao.nome);
    const emailSeguro = escaparHtml(verificacao.email);
    const assuntoSeguro = escaparHtml(verificacao.assunto);
    const mensagemSegura = escaparHtml(verificacao.mensagem).replace(/\n/g, "<br>");

    const htmlContato = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:700px;margin:auto">
        <h2>Novo contato confirmado</h2>
        <p><strong>Nome:</strong> ${nomeSeguro}</p>
        <p><strong>E-mail:</strong> ${emailSeguro}</p>
        <p><strong>Assunto:</strong> ${assuntoSeguro}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${mensagemSegura}</p>
      </div>
    `;

    try {
      await enviarEmailComResend(
        emailDono,
        `Novo contato: ${verificacao.assunto}`,
        htmlContato,
        verificacao.email,
      );
    } catch (erro) {
      // O contato e a confirmação já foram concluídos. Não retornamos
      // erro ao visitante para evitar que ele envie a mensagem novamente.
      console.error("Contato salvo, mas falhou a notificação do dono:", erro);
    }
  }

  return respostaJson({
    sucesso: true,
    mensagem: "Mensagem enviada com sucesso.",
    idContato,
  });
}

// ===============================================================
// SEÇÃO 9 — HANDLER PRINCIPAL
// ===============================================================

Deno.serve(async (requisicao: Request): Promise<Response> => {
  if (requisicao.method === "OPTIONS") {
    return new Response("ok", { headers: CABECALHOS_CORS });
  }

  if (requisicao.method !== "POST") {
    return respostaJson({
      sucesso: false,
      mensagem: "Método não permitido.",
    }, 405);
  }

  if (!enderecoSupabase || !chaveServico || !chaveResend) {
    console.error("Configuração obrigatória da Edge Function ausente.");
    return respostaJson({
      sucesso: false,
      mensagem: "Serviço temporariamente indisponível.",
    }, 500);
  }

  try {
    const corpo = await requisicao.json();
    const etapa = String(corpo?.etapa ?? "").trim();

    if (etapa === "enviar") {
      const nome = String(corpo?.nome ?? "").trim();
      const email = String(corpo?.email ?? "").trim().toLowerCase();
      const assunto = String(corpo?.assunto ?? "").trim();
      const mensagem = String(corpo?.mensagem ?? "").trim();

      return await processarEnvioCodigo(nome, email, assunto, mensagem);
    }

    if (etapa === "confirmar") {
      const email = String(corpo?.email ?? "").trim().toLowerCase();
      const codigo = String(corpo?.codigo ?? "").trim();

      return await processarConfirmacaoCodigo(email, codigo);
    }

    return respostaJson({
      sucesso: false,
      mensagem: "Etapa inválida.",
    }, 400);
  } catch (erro) {
    console.error("Erro inesperado na Edge Function:", erro);

    return respostaJson({
      sucesso: false,
      mensagem: "Não foi possível processar a solicitação agora.",
    }, 500);
  }
});
