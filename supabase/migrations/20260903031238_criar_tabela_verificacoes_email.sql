create table if not exists verificacoes_email (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    codigo text not null,
    nome text not null,
    assunto text not null,
    mensagem text not null,
    criado_em timestamptz default now(),
    expira_em timestamptz not null,
    verificado boolean default false,
    tentativas integer default 0
);

create index if not exists idx_verificacoes_email_email
on verificacoes_email (email);

-- RLS ligado, sem nenhuma policy pública.
-- A Edge Function será responsável pelo acesso ao banco.
alter table verificacoes_email enable row level security;