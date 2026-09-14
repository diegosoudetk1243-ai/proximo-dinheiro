# Estrutura de assinaturas (Mensal e Anual) — Applyfy

Apenas a base de dados, a segurança e a leitura do status. Nada do design, das telas ou dos cálculos atuais muda.

## O que será criado

**1. Tabela de assinaturas no banco**

Uma linha por usuário, com:

- usuário dono da assinatura
- plano: `monthly` ou `yearly`
- situação: `active`, `canceled` ou `past_due`
- identificador da assinatura no gateway (pode ficar vazio até o webhook chegar)
- identificador do cliente no gateway (pode ficar vazio)
- data de início
- data de renovação/expiração (pode ficar vazia)
- datas de criação e atualização

Regras de segurança: cada pessoa só enxerga a própria assinatura; ninguém consegue criar ou editar assinatura pelo app — só o processo do servidor que vai receber o webhook. Isso evita que alguém se torne assinante por conta própria.

**2. Leitura do status no app**

Uma função de leitura que devolve a assinatura do usuário logado (ou "sem assinatura"), usada apenas onde for exibir o status.

**3. Aviso discreto do plano em Configurações**

Um bloco pequeno, no mesmo estilo visual já existente, mostrando: plano atual (Mensal/Anual/Sem assinatura), situação (Ativa / Cancelada / Pagamento pendente) e a próxima data de renovação quando existir. Nenhuma tela é bloqueada.

**4. Endereço do webhook (preparado, desligado)**

Será criado o endereço que o Applyfy vai chamar quando um pagamento for aprovado, cancelado ou falhar:

```text
https://project--5a9e94b8-d2b6-49b2-b15b-80690dd9f384.lovable.app/api/public/webhooks/applyfy
```

(a versão de teste usa o mesmo caminho no endereço `-dev`)

Nesta etapa ele já existe, mas responde recusando toda chamada enquanto a chave de segurança e o formato dos dados do Applyfy não forem informados. Nenhuma credencial, chave ou URL do gateway será inventada.

## O que NÃO será feito agora

- Nenhuma alteração de design, rotas, onboarding, fluxo, movimentações ou cálculos
- Nenhum bloqueio de acesso por assinatura
- Nenhuma integração real com o Applyfy, nenhuma chave criada ou suposta

## Detalhes técnicos

- Migration cria `public.subscriptions` com `user_id uuid not null unique`, `plan text` (`monthly`/`yearly`), `status text` (`active`/`canceled`/`past_due`), `gateway_subscription_id text`, `gateway_customer_id text`, `started_at timestamptz not null default now()`, `current_period_end timestamptz`, timestamps, CHECKs nos dois enums textuais e trigger `set_updated_at`.
- GRANT `SELECT` para `authenticated`, `ALL` para `service_role`; sem acesso `anon`. RLS ligada com uma única policy de `SELECT` em `auth.uid() = user_id`. Escrita só via service role no webhook.
- `src/lib/subscription.ts`: hook `useSubscription()` com React Query lendo `subscriptions` pelo cliente Supabase do navegador (respeitando RLS), sem tocar em `fluxo-data.ts`.
- `src/routes/_authenticated/configuracoes.tsx`: nova seção somente de leitura reutilizando `panel` e os tokens atuais.
- `src/routes/api/public/webhooks/applyfy.ts`: rota TanStack com handler `POST` que hoje retorna `501` e não escreve nada; o bloco de verificação de assinatura HMAC e o mapeamento de eventos ficam marcados como pendentes de informação.

## Depois de aplicar, precisarei de você

1. A chave/segredo de assinatura do webhook do Applyfy (guardo como segredo do projeto).
2. Um exemplo real do corpo (JSON) enviado pelo Applyfy nos eventos de compra aprovada, renovação, cancelamento e falha de pagamento.
3. Os nomes exatos dos eventos do Applyfy.
4. Como identificar o usuário no payload (e-mail do comprador ou algum campo de referência que possamos enviar no checkout).
5. Os identificadores dos dois checkouts (mensal e anual) para mapear o plano.
