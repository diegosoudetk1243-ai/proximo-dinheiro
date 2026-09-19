# Controle de assinaturas do Fluxo App

## Objetivo

Liberar as telas financeiras somente para usuários autenticados com assinatura válida no GGCheckout, preservando login, onboarding, dados atuais e o visual existente. O pagamento continuará totalmente fora do app.

## Estado atual confirmado

- O banco já possui `subscriptions` e `billing_webhook_events`, com campos adicionais de integrações anteriores.
- Existe um webhook GGCheckout parcial em `/api/public/webhooks/ggcheckauti`, com identificadores de produto fixos no código, sem a idempotência e o tratamento de eventos solicitados.
- Todas as sete tabelas públicas atuais estão com RLS ativada; as tabelas financeiras hoje isolam cada usuário, mas não exigem assinatura válida.
- O bloqueio atual exige apenas login. A tela de Configurações já mostra uma assinatura básica usando o modelo antigo.

## Implementação

### 1. Migrar o banco sem perder dados

- Criar `public.assinaturas` com:
  - `id`, `email` normalizado em minúsculas e único;
  - `user_id` opcional, relacionado a `profiles.id` (relação segura e indireta com o usuário autenticado, sem criar dependência direta no schema interno de autenticação);
  - `plano`: `mensal` ou `anual`;
  - `status`: `ativo`, `cancelado`, `vencido` ou `reembolsado`;
  - `vence_em`, `created_at` e `updated_at`.
- Criar `public.webhook_logs` com `id`, `recebido_em`, `evento`, `event_key` único, `payload`, `processado` e `erro`.
- Conceder acesso completo somente ao serviço do servidor; clientes autenticados terão apenas leitura restrita da própria assinatura, e nenhum cliente terá acesso aos logs.
- Migrar para `assinaturas` os registros aproveitáveis da tabela `subscriptions`, traduzindo plano/status e preservando datas. As tabelas antigas permanecerão intactas para evitar uma alteração destrutiva, mas o app deixará de depender delas.
- Criar trigger de `updated_at` e índices de e-mail, usuário e vencimento.

### 2. Vínculo por e-mail e regra central de acesso

- Atualizar o cadastro para sempre normalizar e-mail em minúsculas.
- Estender o processo seguro de criação de usuário para vincular uma assinatura pré-existente pelo e-mail.
- Criar uma função segura de vínculo para cobrir também logins de contas existentes e compras feitas depois do cadastro; ela só poderá vincular o usuário autenticado ao mesmo e-mail presente no token.
- Criar `public.tem_acesso()` como `SECURITY DEFINER`, com `search_path` fixo e permissões mínimas. Ela retornará `true` apenas quando o e-mail autenticado possuir assinatura:
  - com `vence_em > now()`; e
  - em estado `ativo` ou `cancelado`.
- Assinatura cancelada manterá acesso até a data paga; vencida ou reembolsada perderá acesso.

### 3. RLS completa e bloqueio real dos dados

- Revisar e substituir as policies de `accounts`, `categories`, `profiles`, `transactions` e `recurring_transactions` para exigir simultaneamente:
  - identidade da linha igual a `auth.uid()`; e
  - `public.tem_acesso() = true`.
- Manter as categorias globais somente para usuários com acesso válido.
- Manter `assinaturas` somente leitura da própria linha pelo e-mail do token, sem INSERT/UPDATE/DELETE pelo navegador.
- Manter `webhook_logs` sem qualquer acesso do navegador.
- Confirmar grants, RLS e policies de todas as tabelas públicas após a migração.

### 4. Webhook GGCheckout idempotente

- Substituir a implementação parcial por um endpoint público canônico:
  - `/api/public/webhooks/ggcheckout`
- Neste projeto, esse endpoint de servidor é o equivalente correto à Edge Function e será a URL entregue ao GGCheckout; nenhuma nova Edge Function separada será criada.
- Manter temporariamente a rota antiga `/api/public/webhooks/ggcheckauti` como encaminhamento compatível, evitando quebrar uma configuração já existente.
- Validar `GGCHECKOUT_WEBHOOK_SECRET` em uma função isolada, aceitando somente a forma de cabeçalho documentada/compatível com a integração atual; token inválido retorna `401`.
- Centralizar em um único adaptador a extração de:
  - evento;
  - e-mail do comprador;
  - produto;
  - ID da transação/assinatura;
  - status do Pix.
- Identificar o plano exclusivamente pelas configurações `PRODUTO_MENSAL` e `PRODUTO_ANUAL`; nenhum ID será fixado ou inventado.
- Registrar o corpo recebido antes do processamento. A chave idempotente combinará o identificador estável do evento/transação com o tipo do evento; se o gateway não o fornecer, será usado um hash determinístico do payload.
- Processar em transação no banco para impedir que reenvios concorrentes somem prazo duas vezes.
- Regras:
  - `card paid` e Pix com estado pago/aprovado: `ativo`; mensal soma 30 dias e anual soma 365, partindo de `vence_em` quando ainda futura, senão de agora;
  - `subscription canceled`: `cancelado`, sem alterar `vence_em`;
  - `subscription past_due`: muda para `vencido` somente se `vence_em` já passou;
  - `card refunded` e `pix refunded`: `reembolsado`, com `vence_em = now()`;
  - eventos de geração, pendência, expiração, falha, abandono, quiz e desconhecidos: apenas log, resposta `200`.
- Responder `200` para processado, duplicado ou ignorado; `500` somente quando houver falha real e registrar o erro para reenvio.

### 5. Bloqueio e telas do app

- Adicionar uma verificação central no grupo autenticado: após validar a sessão, vincular a assinatura por e-mail e consultar `tem_acesso()`.
- Sem acesso, redirecionar para a rota pública autenticável `/assinar`; evitar ciclos de redirecionamento e preservar o logout.
- Criar `/assinar` com mensagem objetiva, botão para `URL_PAGINA_VENDAS` e botão de sair. A constante ficará com placeholder explícito para substituição posterior, sem inventar endereço.
- Substituir o bloco básico de Configurações por “Minha assinatura”, lendo `assinaturas` e exibindo plano, status e `Acesso até dd/mm/aaaa`.
- Para cancelamento, exibir exatamente: “Assinatura cancelada. Você tem acesso até dd/mm/aaaa.”
- Após um webhook válido, invalidar/atualizar a leitura naturalmente no próximo acesso sem alterar as demais telas.

### 6. Termos, privacidade e aceite

- Criar `/termos` e `/privacidade` em português, mantendo o padrão visual atual e metadados próprios.
- Termos: planos mensal de R$ 24,90 e anual de R$ 149,90, renovação automática, cancelamento com acesso até o fim do período e reembolso em até 7 dias.
- Privacidade: dados coletados, finalidades, base de tratamento, segurança, direitos LGPD e contato.
- Preservar literalmente os placeholders `[NOME/EMPRESA]`, `[CPF/CNPJ]` e `[E-MAIL DE SUPORTE]`.
- Adicionar links no rodapé público e no cadastro.
- Exigir o checkbox “Li e aceito” apenas ao criar conta, com links para os dois documentos; registrar data e versão do aceite nos metadados do cadastro para auditoria básica.

## Secrets e configurações esperadas

A implementação referenciará estes nomes exatos, sem criar valores:

- `GGCHECKOUT_WEBHOOK_SECRET`
- `PRODUTO_MENSAL`
- `PRODUTO_ANUAL`

`URL_PAGINA_VENDAS` será uma constante pública com placeholder no código, conforme solicitado, e não um secret.

## Validação final

- Aplicar a migração e atualizar os tipos do banco.
- Verificar typecheck e lint somente nos arquivos alterados.
- Testar webhook com: token inválido, evento novo, duplicado, renovação, cancelamento, atraso ainda vigente, atraso vencido, reembolso, Pix aprovado e evento ignorado.
- Testar no navegador desktop e mobile:
  - login sem assinatura → `/assinar`;
  - login com assinatura ativa → telas atuais e onboarding;
  - assinatura cancelada ainda vigente → acesso e mensagem correta;
  - vencida/reembolsada → bloqueio;
  - cadastro sem aceite impedido;
  - termos, privacidade, Minha assinatura e logout.
