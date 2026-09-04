// ===============================================================
// EDGE FUNCTION: VERIFICAR E-MAIL
// ===============================================================
//
// RESPONSABILIDADE DESTA FUNÇÃO:
//
// 1. Receber os dados do formulário de contato.
// 2. Validar os dados recebidos.
// 3. Gerar um código de verificação de 6 dígitos.
// 4. Transformar o código em hash antes de salvar no banco.
// 5. Enviar o código original para o visitante através do Resend.
// 6. Receber o código digitado pelo visitante.
// 7. Comparar o hash do código informado com o hash armazenado.
// 8. Após a confirmação, salvar o contato na tabela "contatos".
// 9. Marcar a verificação como concluída.
// 10. Enviar a mensagem confirmada para o dono do portfólio.
//
// IMPORTANTE:
//
// - Esta função roda no servidor através do Supabase Edge Functions.
// - Chaves secretas NÃO devem aparecer no frontend.
// - RESEND_API_KEY NÃO deve aparecer no app.js.
// - SUPABASE_SERVICE_ROLE_KEY NÃO deve aparecer no app.js.
// - A tabela "contatos" continua protegida por RLS.
// - O frontend conversa com esta função, e não diretamente com
//   a tabela "contatos".
// ===============================================================


// ===============================================================
// IMPORTAÇÃO
// ===============================================================
//
// O createClient é fornecido pelo Supabase.
// O nome "createClient" permanece em inglês porque é uma função
// oficial da biblioteca.
// ===============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// ===============================================================
// SEÇÃO 1 — CONFIGURAÇÕES E SECRETS
// ===============================================================
//
// Estas informações são obtidas dos Secrets da Edge Function.
//
// NUNCA coloque estas informações diretamente neste arquivo:
//
// - RESEND_API_KEY
// - SUPABASE_SERVICE_ROLE_KEY
//
// Elas devem permanecer configuradas no Supabase.
// ===============================================================

const enderecoSupabase =
  Deno.env.get("SUPABASE_URL") ?? "";

const chaveServico =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const chaveResend =
  Deno.env.get("API_RESEND") ?? "";

const emailDono =
  Deno.env.get("EMAIL_DESTINO") ?? "";

const remetenteEmail =
  Deno.env.get("REMETENTE_EMAIL") ?? "onboarding@resend.dev";

// ===============================================================
// CONFIGURAÇÃO NECESSÁRIA NO SUPABASE
// ===============================================================
//
// Você NÃO precisa escrever as chaves diretamente neste arquivo.
//
// No painel do Supabase, configure estes Secrets:
//
// RESEND_API_KEY   = cole aqui a chave da Resend
// EMAIL_DESTINO    = e-mail que receberá as mensagens do portfólio
// REMETENTE_EMAIL  = onboarding@resend.dev
//
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são lidos pelo ambiente
// da Edge Function.
// ===============================================================


// ===============================================================
// SEÇÃO 2 — VALIDAÇÃO DAS CONFIGURAÇÕES
// ===============================================================
//
// Antes de executar qualquer operação, verificamos se os Secrets
// necessários realmente existem.
//
// Isso facilita muito a identificação de problemas durante o
// desenvolvimento.
// ===============================================================

if (!enderecoSupabase) {
  console.error("SUPABASE_URL não foi configurado.");
}

if (!chaveServico) {
  console.error("SUPABASE_SERVICE_ROLE_KEY não foi configurado.");
}

if (!chaveResend) {
  console.error("RESEND_API_KEY não foi configurado.");
}

if (!emailDono) {
  console.error("EMAIL_DESTINO não foi configurado.");
}


// ===============================================================
// SEÇÃO 3 — CLIENTE DO SUPABASE
// ===============================================================
//
// Este cliente utiliza a chave de serviço.
//
// ATENÇÃO:
//
// Esta chave possui privilégios elevados e, por isso, só pode ser
// utilizada dentro da Edge Function.
//
// Ela NUNCA deve ser enviada para o navegador.
// ===============================================================

const bancoServico = createClient(
  enderecoSupabase,
  chaveServico
);


// ===============================================================
// SEÇÃO 4 — CORS
// ===============================================================
//
// Permite que o frontend do portfólio consiga chamar a Edge
// Function.
//
// Atualmente utilizamos "*" porque o formulário é público.
//
// Depois que o domínio definitivo do portfólio estiver definido,
// podemos restringir para o domínio específico.
// ===============================================================

const CABECALHOS_CORS = {
  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};


// ===============================================================
// SEÇÃO 5 — RESPOSTA PADRONIZADA
// ===============================================================
//
// Mantemos todas as respostas da função no formato JSON.
//
// Isso facilita o trabalho do app.js, porque ele sempre poderá
// verificar:
//
// resposta.sucesso
//
// e:
//
// resposta.mensagem
// ===============================================================

function respostaJson(
  corpo: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(corpo),
    {
      status,

      headers: {
        ...CABECALHOS_CORS,
        "Content-Type": "application/json",
      },
    },
  );
}


// ===============================================================
// SEÇÃO 6 — VALIDAÇÃO DE E-MAIL
// ===============================================================
//
// Esta validação verifica apenas se o texto possui uma estrutura
// básica de e-mail.
//
// IMPORTANTE:
//
// Regex NÃO comprova que o endereço realmente existe.
//
// A confirmação real acontece posteriormente através do código
// enviado pelo Resend.
// ===============================================================

function validarEmail(emailInformado: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    emailInformado,
  );
}


// ===============================================================
// SEÇÃO 7 — GERAÇÃO DO CÓDIGO
// ===============================================================
//
// Gera um código numérico de 6 dígitos.
//
// Utilizamos crypto.getRandomValues() em vez de Math.random(),
// porque crypto fornece uma geração adequada para códigos de
// verificação.
//
// Exemplo:
//
// 483271
// ===============================================================

function gerarCodigoVerificacao(): string {
  const bytesAleatorios = new Uint32Array(1);

  crypto.getRandomValues(bytesAleatorios);

  const numero =
    bytesAleatorios[0] % 1000000;

  return numero
    .toString()
    .padStart(6, "0");
}


// ===============================================================
// SEÇÃO 8 — GERAR HASH DO CÓDIGO
// ===============================================================
//
// O código original NÃO será armazenado no banco.
//
// Exemplo:
//
// Código enviado:
//
// 483271
//
// O banco armazenará apenas algo semelhante a:
//
// a8f9...
//
// Durante a confirmação, transformamos o código digitado pelo
// visitante em hash novamente e comparamos os dois valores.
//
// Isso evita armazenar o código em texto puro.
// ===============================================================

async function gerarHashCodigo(
  codigo: string,
): Promise<string> {

  const dadosCodigo =
    new TextEncoder().encode(codigo);

  const resultadoHash =
    await crypto.subtle.digest(
      "SHA-256",
      dadosCodigo,
    );

  const bytesHash =
    new Uint8Array(resultadoHash);

  return Array
    .from(bytesHash)
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}


// ===============================================================
// SEÇÃO 9 — ESCAPAR HTML
// ===============================================================
//
// Os dados digitados pelo visitante podem conter caracteres
// especiais.
//
// Antes de colocar qualquer informação dentro do HTML do e-mail,
// escapamos os caracteres perigosos.
//
// Isso evita que alguém tente inserir HTML ou JavaScript dentro
// dos dados enviados pelo formulário.
// ===============================================================

function escaparHtml(
  textoOriginal: string,
): string {

  return textoOriginal
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


// ===============================================================
// SEÇÃO 10 — ENVIO DE E-MAIL PELO RESEND
// ===============================================================
//
// Esta função centraliza todo envio de e-mail.
//
// Ela é utilizada para:
//
// 1. Enviar o código de confirmação ao visitante.
// 2. Enviar o contato confirmado para o dono do portfólio.
//
// A RESEND_API_KEY permanece somente no servidor.
// ===============================================================

async function enviarEmailComResend(
  destino: string,
  assunto: string,
  html: string,
  replyTo?: string,
) {

  // -------------------------------------------------------------
  // Verifica se a chave do Resend está disponível.
  // -------------------------------------------------------------

  if (!chaveResend) {
    throw new Error(
      "RESEND_API_KEY não está configurada.",
    );
  }


  // -------------------------------------------------------------
  // Envia a requisição para a API oficial do Resend.
  // -------------------------------------------------------------

  const resposta = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${chaveResend}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({

        // ---------------------------------------------------------
        // Remetente utilizado pelo Resend.
        //
        // Em desenvolvimento:
        // onboarding@resend.dev
        //
        // Em produção:
        // recomendamos utilizar um domínio verificado.
        // ---------------------------------------------------------

        from: `Portfólio <${remetenteEmail}>`,

        // Destinatário.
        to: [destino],

        // Assunto.
        subject: assunto,

        // Conteúdo HTML.
        html,

        // reply_to é utilizado somente quando fornecido.
        //
        // No e-mail enviado para o dono do portfólio, isso permite
        // clicar em "Responder" e responder diretamente ao visitante.
        ...(replyTo
          ? { reply_to: replyTo }
          : {}),
      }),
    },
  );


  // -------------------------------------------------------------
  // O Resend retornou erro?
  // -------------------------------------------------------------

  if (!resposta.ok) {

    const detalhesErro =
      await resposta.text();

    throw new Error(
      `Falha ao enviar e-mail pelo Resend: ${detalhesErro}`,
    );
  }


  // -------------------------------------------------------------
  // Retorno do Resend bem-sucedido.
  // -------------------------------------------------------------

  return true;
}


// ===============================================================
// SEÇÃO 11 — EDGE FUNCTION PRINCIPAL
// ===============================================================
//
// Todas as requisições para:
//
// verificar-email
//
// passam por aqui.
// ===============================================================

Deno.serve(async (requisicao) => {

  // =============================================================
  // SEÇÃO 11.1 — TRATAMENTO DO PREFLIGHT CORS
  // =============================================================
  //
  // Navegadores podem enviar uma requisição OPTIONS antes do POST.
  //
  // Respondemos imediatamente para permitir a comunicação.
  // =============================================================

  if (requisicao.method === "OPTIONS") {

    return new Response(
      "ok",
      {
        headers: CABECALHOS_CORS,
      },
    );
  }


  // =============================================================
  // SEÇÃO 11.2 — ACEITAR SOMENTE POST
  // =============================================================
  //
  // Nosso formulário envia dados.
  //
  // Por isso, a função trabalha com POST.
  // =============================================================

  if (requisicao.method !== "POST") {

    return respostaJson(
      {
        sucesso: false,
        mensagem: "Método não permitido.",
      },
      405,
    );
  }


  try {

    // ===========================================================
    // SEÇÃO 12 — LEITURA DO CORPO DA REQUISIÇÃO
    // ===========================================================
    //
    // O frontend enviará um JSON.
    //
    // Exemplo:
    //
    // {
    //   "etapa": "enviar",
    //   "nome": "Nathan",
    //   "email": "email@email.com",
    //   "assunto": "Teste",
    //   "mensagem": "Mensagem de teste."
    // }
    // ===========================================================

    const corpo =
      await requisicao.json();

    const etapa =
      String(corpo.etapa ?? "")
        .trim();


    // ===========================================================
    // SEÇÃO 13 — ETAPA: ENVIAR CÓDIGO
    // ===========================================================

    if (etapa === "enviar") {

      // ---------------------------------------------------------
      // Captura e normalização dos dados.
      // ---------------------------------------------------------

      const nome =
        String(corpo.nome ?? "")
          .trim();

      const email =
        String(corpo.email ?? "")
          .trim()
          .toLowerCase();

      const assunto =
        String(corpo.assunto ?? "")
          .trim();

      const mensagem =
        String(corpo.mensagem ?? "")
          .trim();


      // ---------------------------------------------------------
      // Validação dos dados.
      // ---------------------------------------------------------

      if (
        nome.length < 2 ||
        !validarEmail(email) ||
        assunto.length < 2 ||
        mensagem.length < 10
      ) {

        return respostaJson(
          {
            sucesso: false,
            mensagem: "Dados inválidos.",
          },
          400,
        );
      }


      // =========================================================
      // SEÇÃO 13.1 — LIMITE DE SOLICITAÇÕES
      // =========================================================
      //
      // Limite:
      //
      // máximo de 5 solicitações por e-mail dentro de 1 hora.
      //
      // Isso reduz abuso do sistema de envio.
      // =========================================================

      const umaHoraAtras =
        new Date(
          Date.now() - 60 * 60 * 1000,
        ).toISOString();


      const {
        count: totalRecente,
        error: erroContagem,
      } = await bancoServico
        .from("verificacoes_email")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .eq("email", email)
        .gte(
          "criado_em",
          umaHoraAtras,
        );


      // ---------------------------------------------------------
      // Se houve erro consultando o banco, não continuamos.
      // ---------------------------------------------------------

      if (erroContagem) {

        console.error(
          "Erro ao consultar limite de solicitações:",
          erroContagem,
        );

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Não foi possível processar sua solicitação.",
          },
          500,
        );
      }


      // ---------------------------------------------------------
      // Bloqueia excesso de solicitações.
      // ---------------------------------------------------------

      if ((totalRecente ?? 0) >= 5) {

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Muitas tentativas. Aguarde um pouco antes de pedir um novo código.",
          },
          429,
        );
      }


      // =========================================================
      // SEÇÃO 13.2 — INTERVALO ENTRE SOLICITAÇÕES
      // =========================================================
      //
      // Mesmo que o usuário ainda esteja dentro das 5 tentativas
      // permitidas, não permitimos solicitar outro código antes
      // de 60 segundos.
      // =========================================================

      const {
        data: ultimaSolicitacao,
        error: erroUltimaSolicitacao,
      } = await bancoServico
        .from("verificacoes_email")
        .select("criado_em")
        .eq("email", email)
        .order(
          "criado_em",
          {
            ascending: false,
          },
        )
        .limit(1)
        .maybeSingle();


      if (erroUltimaSolicitacao) {

        console.error(
          "Erro ao consultar última solicitação:",
          erroUltimaSolicitacao,
        );

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Não foi possível processar sua solicitação.",
          },
          500,
        );
      }


      // ---------------------------------------------------------
      // Calcula quanto tempo passou desde o último pedido.
      // ---------------------------------------------------------

      if (ultimaSolicitacao) {

        const segundosDesdeUltima =
          (
            Date.now() -
            new Date(
              ultimaSolicitacao.criado_em,
            ).getTime()
          ) / 1000;


        if (segundosDesdeUltima < 60) {

          return respostaJson(
            {
              sucesso: false,

              mensagem:
                `Aguarde ${Math.ceil(
                  60 - segundosDesdeUltima,
                )}s para solicitar um novo código.`,
            },
            429,
          );
        }
      }


      // =========================================================
      // SEÇÃO 13.3 — INVALIDAR CÓDIGOS ANTERIORES
      // =========================================================
      //
      // Se o visitante solicitar um novo código, qualquer código
      // anterior ainda pendente deixa de ser válido.
      //
      // Isso evita que vários códigos permaneçam utilizáveis.
      // =========================================================

      const {
        error: erroInvalidacao,
      } = await bancoServico
        .from("verificacoes_email")
        .update({
          expira_em:
            new Date(0).toISOString(),
        })
        .eq("email", email)
        .is("verificado_em", null);


      if (erroInvalidacao) {

        console.error(
          "Erro ao invalidar verificações anteriores:",
          erroInvalidacao,
        );

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Não foi possível gerar um novo código.",
          },
          500,
        );
      }


      // =========================================================
      // SEÇÃO 13.4 — GERAR CÓDIGO
      // =========================================================

      const codigo =
        gerarCodigoVerificacao();


      // =========================================================
      // SEÇÃO 13.5 — GERAR HASH
      // =========================================================
      //
      // O código original será enviado por e-mail.
      //
      // SOMENTE o hash será salvo no banco.
      // =========================================================

      const codigoHash =
        await gerarHashCodigo(codigo);


      // =========================================================
      // SEÇÃO 13.6 — DEFINIR EXPIRAÇÃO
      // =========================================================
      //
      // O código será válido durante 10 minutos.
      // =========================================================

      const expiraEm =
        new Date(
          Date.now() + 10 * 60 * 1000,
        ).toISOString();


      // =========================================================
      // SEÇÃO 13.7 — SALVAR VERIFICAÇÃO
      // =========================================================
      //
      // ATENÇÃO:
      //
      // Aqui utilizamos "codigo_hash".
      //
      // NÃO utilizamos "codigo".
      //
      // Isso corresponde à estrutura segura da tabela.
      // =========================================================

      const {
        error: erroInsercao,
      } = await bancoServico
        .from("verificacoes_email")
        .insert({
          email,

          // -------------------------------------------------------
          // Salva somente o hash.
          // -------------------------------------------------------

          codigo_hash: codigoHash,

          nome,
          assunto,
          mensagem,

          expira_em: expiraEm,

          // -------------------------------------------------------
          // Nova verificação começa como não confirmada.
          // -------------------------------------------------------

          verificado_em: null,

          // -------------------------------------------------------
          // Nenhuma tentativa incorreta ainda foi realizada.
          // -------------------------------------------------------

          tentativas: 0,
        });


      if (erroInsercao) {

        console.error(
          "Erro ao gravar verificação:",
          erroInsercao,
        );

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Não foi possível enviar o código. Tente novamente.",
          },
          500,
        );
      }


      // =========================================================
      // SEÇÃO 13.8 — ENVIAR CÓDIGO POR E-MAIL
      // =========================================================
      //
      // O visitante recebe o código ORIGINAL.
      //
      // O banco continua armazenando somente o HASH.
      // =========================================================

      try {

        await enviarEmailComResend(
          email,

          "Seu código de confirmação",

          `
            <div>
              <p>Olá, ${escaparHtml(nome)}!</p>

              <p>
                Seu código de confirmação é:
              </p>

              <h2>
                ${codigo}
              </h2>

              <p>
                Este código expira em 10 minutos.
              </p>

              <p>
                Se você não solicitou este código,
                ignore este e-mail.
              </p>
            </div>
          `,
        );

      } catch (erroResend) {

        // -------------------------------------------------------
        // Se o Resend falhar, registramos o erro.
        //
        // O registro do código continua no banco, mas a resposta
        // informa que o envio não foi concluído.
        // -------------------------------------------------------

        console.error(
          "Erro ao enviar código pelo Resend:",
          erroResend,
        );

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Não foi possível enviar o código por e-mail. Tente novamente.",
          },
          500,
        );
      }


      // =========================================================
      // SEÇÃO 13.9 — RESPOSTA DE SUCESSO
      // =========================================================

      return respostaJson({
        sucesso: true,
        mensagem:
          "Código enviado com sucesso.",
      });
    }


    // ===========================================================
    // SEÇÃO 14 — ETAPA: CONFIRMAR CÓDIGO
    // ===========================================================

    if (etapa === "confirmar") {

      // ---------------------------------------------------------
      // Recupera o e-mail informado.
      // ---------------------------------------------------------

      const email =
        String(corpo.email ?? "")
          .trim()
          .toLowerCase();


      // ---------------------------------------------------------
      // Recupera o código digitado.
      // ---------------------------------------------------------

      const codigoRecebido =
        String(corpo.codigo ?? "")
          .trim();


      // ---------------------------------------------------------
      // Valida e-mail e código.
      //
      // O código precisa ter exatamente 6 números.
      // ---------------------------------------------------------

      if (
        !validarEmail(email) ||
        !/^\d{6}$/.test(codigoRecebido)
      ) {

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Código ou e-mail inválido.",
          },
          400,
        );
      }


      // =========================================================
      // SEÇÃO 14.1 — BUSCAR ÚLTIMA VERIFICAÇÃO
      // =========================================================

      const {
        data: verificacao,
        error: erroBusca,
      } = await bancoServico
        .from("verificacoes_email")
        .select("*")
        .eq("email", email)
        .is("verificado_em", null)
        .order(
          "criado_em",
          {
            ascending: false,
          },
        )
        .limit(1)
        .maybeSingle();


      // ---------------------------------------------------------
      // Não encontrou uma verificação válida.
      // ---------------------------------------------------------

      if (erroBusca) {

        console.error(
          "Erro ao buscar verificação:",
          erroBusca,
        );

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Não foi possível verificar o código.",
          },
          500,
        );
      }


      if (!verificacao) {

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Solicite um novo código.",
          },
          400,
        );
      }


      // =========================================================
      // SEÇÃO 14.2 — VERIFICAR EXPIRAÇÃO
      // =========================================================

      if (
        new Date(
          verificacao.expira_em,
        ).getTime() < Date.now()
      ) {

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "O código expirou. Solicite um novo código.",
          },
          400,
        );
      }


      // =========================================================
      // SEÇÃO 14.3 — LIMITE DE TENTATIVAS
      // =========================================================

      if (
        (verificacao.tentativas ?? 0) >= 5
      ) {

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Muitas tentativas incorretas. Solicite um novo código.",
          },
          429,
        );
      }


      // =========================================================
      // SEÇÃO 14.4 — GERAR HASH DO CÓDIGO RECEBIDO
      // =========================================================
      //
      // O visitante digitou, por exemplo:
      //
      // 483271
      //
      // Transformamos novamente esse código em SHA-256.
      // =========================================================

      const codigoRecebidoHash =
        await gerarHashCodigo(
          codigoRecebido,
        );


      // =========================================================
      // SEÇÃO 14.5 — COMPARAR OS HASHES
      // =========================================================
      //
      // NÃO comparamos:
      //
      // verificacao.codigo
      //
      // porque não armazenamos mais o código original.
      //
      // Comparamos:
      //
      // verificacao.codigo_hash
      //
      // com:
      //
      // codigoRecebidoHash
      // =========================================================

      if (
        verificacao.codigo_hash !==
        codigoRecebidoHash
      ) {

        const tentativasAtuais =
          verificacao.tentativas ?? 0;


        const {
          error: erroAtualizacaoTentativas,
        } = await bancoServico
          .from("verificacoes_email")
          .update({
            tentativas:
              tentativasAtuais + 1,
          })
          .eq(
            "id",
            verificacao.id,
          );


        if (erroAtualizacaoTentativas) {

          console.error(
            "Erro ao atualizar tentativas:",
            erroAtualizacaoTentativas,
          );
        }


        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "O código informado está incorreto.",
          },
          400,
        );
      }


      // =========================================================
      // SEÇÃO 15 — CÓDIGO CORRETO
      // =========================================================
      //
      // Neste ponto o visitante provou que possui acesso ao
      // endereço de e-mail informado.
      //
      // Agora podemos salvar o contato definitivo.
      // =========================================================


      // =========================================================
      // SEÇÃO 15.1 — VERIFICAR DUPLICIDADE
      // =========================================================
      //
      // Uma verificação já pode ter sido processada anteriormente
      // devido a uma repetição da requisição.
      //
      // Essa consulta ajuda a reduzir duplicidades.
      //
      // OBSERVAÇÃO:
      // A proteção definitiva contra duplicidade pode futuramente
      // utilizar uma chave de idempotência ou outra estratégia.
      // =========================================================

      const {
        data: contatoExistente,
        error: erroContatoExistente,
      } = await bancoServico
        .from("contatos")
        .select("id")
        .eq("email", verificacao.email)
        .eq("assunto", verificacao.assunto)
        .eq("mensagem", verificacao.mensagem)
        .gte(
          "criado_em",
          new Date(
            Date.now() - 15 * 60 * 1000,
          ).toISOString(),
        )
        .limit(1)
        .maybeSingle();


      if (erroContatoExistente) {

        console.error(
          "Erro ao verificar contato existente:",
          erroContatoExistente,
        );

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Não foi possível validar sua mensagem.",
          },
          500,
        );
      }


      // =========================================================
      // SEÇÃO 15.2 — SALVAR CONTATO
      // =========================================================
      //
      // Se o contato ainda não existe, realizamos o INSERT.
      // =========================================================

      let idContatoSalvo =
        contatoExistente?.id ?? null;


      if (!contatoExistente) {

        const {
          data: contatoSalvo,
          error: erroContato,
        } = await bancoServico
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

          console.error(
            "Erro ao salvar contato:",
            erroContato,
          );

          return respostaJson(
            {
              sucesso: false,
              mensagem:
                "Não foi possível salvar sua mensagem. Tente novamente.",
            },
            500,
          );
        }


        idContatoSalvo =
          contatoSalvo?.id ?? null;
      }


      // =========================================================
      // SEÇÃO 15.3 — MARCAR VERIFICAÇÃO COMO CONCLUÍDA
      // =========================================================
      //
      // IMPORTANTE:
      //
      // Fazemos isso ANTES de enviar a notificação para o dono.
      //
      // Por quê?
      //
      // Imagine:
      //
      // 1. Código correto.
      // 2. Contato salvo.
      // 3. Resend apresenta uma falha temporária.
      //
      // Se deixássemos "verificado_em = null", o visitante poderia
      // repetir a confirmação e criar um segundo contato.
      //
      // Marcando a verificação agora, evitamos esse problema.
      // =========================================================

      const {
        error: erroVerificacao,
      } = await bancoServico
        .from("verificacoes_email")
        .update({
          verificado_em: new Date().toISOString(),
        })
        .eq(
          "id",
          verificacao.id,
        );


      if (erroVerificacao) {

        console.error(
          "Contato salvo, mas não foi possível marcar a verificação como concluída:",
          erroVerificacao,
        );

        // -------------------------------------------------------
        // Não retornamos sucesso aqui porque o estado da
        // verificação não foi atualizado corretamente.
        //
        // Esse erro precisa ser observado nos logs.
        // -------------------------------------------------------

        return respostaJson(
          {
            sucesso: false,
            mensagem:
              "Sua mensagem foi processada, mas houve um problema ao concluir a verificação.",
          },
          500,
        );
      }


      // =========================================================
      // SEÇÃO 15.4 — ENVIAR NOTIFICAÇÃO PARA O DONO
      // =========================================================
      //
      // Agora enviamos a mensagem confirmada para o dono do
      // portfólio.
      //
      // O e-mail do visitante é colocado como reply_to.
      //
      // Assim, ao clicar em "Responder", você poderá responder
      // diretamente ao visitante.
      // =========================================================

      try {

        await enviarEmailComResend(

          emailDono,

          "Novo contato pelo portfólio",

          `
            <div>

              <h2>
                Novo contato pelo portfólio
              </h2>

              <p>
                <strong>Nome:</strong>
                ${escaparHtml(verificacao.nome)}
              </p>

              <p>
                <strong>E-mail:</strong>
                ${escaparHtml(verificacao.email)}
              </p>

              <p>
                <strong>Assunto:</strong>
                ${escaparHtml(verificacao.assunto)}
              </p>

              <p>
                <strong>Mensagem:</strong>
              </p>

              <p>
                ${escaparHtml(verificacao.mensagem)}
              </p>

            </div>
          `,

          // -----------------------------------------------------
          // Permite responder diretamente ao visitante.
          // -----------------------------------------------------

          verificacao.email,
        );

      } catch (erroNotificacao) {

        // -------------------------------------------------------
        // IMPORTANTE:
        //
        // O contato JÁ foi salvo.
        //
        // A verificação JÁ foi marcada como concluída.
        //
        // Portanto NÃO devemos retornar erro que faça o frontend
        // tentar salvar novamente.
        //
        // Apenas registramos o problema nos logs.
        // -------------------------------------------------------

        console.error(
          "Contato salvo, mas não foi possível enviar a notificação ao dono:",
          erroNotificacao,
        );

        return respostaJson({
          sucesso: true,

          mensagem:
            "Obrigado por entrar em contato!.\n Responderei o mais breve possivel!",
        });
      }


      // =========================================================
      // SEÇÃO 15.5 — SUCESSO FINAL
      // =========================================================

      return respostaJson({
        sucesso: true,

        mensagem:
          "Obrigado por entrar em contato!.\n Responderei o mais breve possivel!",

        // -------------------------------------------------------
        // O ID não é necessário para o frontend neste momento.
        //
        // Ele pode ser útil durante testes e desenvolvimento.
        // Se não houver necessidade, pode ser removido depois.
        // -------------------------------------------------------

        id: idContatoSalvo,
      });
    }


    // ===========================================================
    // SEÇÃO 16 — ETAPA INVÁLIDA
    // ===========================================================
    //
    // Se o frontend enviar uma etapa diferente de:
    //
    // "enviar"
    //
    // ou:
    //
    // "confirmar"
    //
    // rejeitamos a requisição.
    // ===========================================================

    return respostaJson(
      {
        sucesso: false,
        mensagem: "Etapa inválida.",
      },
      400,
    );


  } catch (erro) {

    // ===========================================================
    // SEÇÃO 17 — ERRO GERAL
    // ===========================================================
    //
    // Qualquer erro inesperado passa por aqui.
    //
    // O detalhe técnico fica somente nos logs.
    //
    // O visitante recebe uma mensagem genérica.
    // ===========================================================

    console.error(
      "Erro inesperado na Edge Function:",
      erro,
    );


    return respostaJson(
      {
        sucesso: false,
        mensagem:
          "Erro interno. Tente novamente.",
      },
      500,
    );
  }
});