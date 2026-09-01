// ============================================
// SEÇÃO 5 — CONFIGURAÇÃO DO SUPABASE
// Objetivo: conectar o portfólio ao banco.
// ============================================

const enderecoSupabase = 'https://oytbdvvjkmawgqvfpbrb.supabase.co';

const chavePublicaSupabase = 'sb_publishable_VOB67Ia_Sq5tPwaU9WRS1A_9YwwtBb1';

const bancoDeContatos = window.supabase.createClient(
    enderecoSupabase,
    chavePublicaSupabase
);

// ============================================
// SEÇÃO 5.1 — VERIFICAÇÃO DO DOMÍNIO DO E-MAIL
// Objetivo: verificar se o domínio informado
// possui registro MX para receber e-mails.
// Isso NÃO confirma a existência da caixa postal.
// ============================================

async function verificarDominioEmail(enderecoEmail) {
    const parteDominio = enderecoEmail.split('@')[1]?.toLowerCase().trim();

    if (!parteDominio) {
        return false;
    }

    try {
        const resposta = await fetch(
            `https://dns.google/resolve?name=${encodeURIComponent(parteDominio)}&type=MX`
        );

        if (!resposta.ok) {
            return false;
        }

        const resultadoDns = await resposta.json();

        return Array.isArray(resultadoDns.Answer) &&
            resultadoDns.Answer.some((registro) => registro.type === 15);

    } catch (erro) {
        console.error('Erro ao verificar o domínio do e-mail:', erro);
        return false;
    }
}
