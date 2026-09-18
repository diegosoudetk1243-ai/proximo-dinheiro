# Auditoria técnica e plano de assinaturas — Fluxo App + GGCheckout

Nenhuma alteração será aplicada nesta etapa. Este documento separa fatos confirmados no projeto e no banco de recomendações que dependem da GGCheckout.

## Resumo executivo

O Fluxo App usa **TanStack Start** no aplicativo e **Lovable Cloud**, com autenticação e banco PostgreSQL gerenciados. Não há Edge Functions: o backend do aplicativo usa rotas e funções do próprio TanStack Start.

O isolamento básico entre usuários existe no banco por RLS e está correto para impedir leitura direta de linhas cujo `user_id` pertence a outra pessoa. Porém, o sistema de assinaturas atual está incompleto e não deve ser colocado em produção:

- existe uma tabela `subscriptions`, hoje vazia;
- existe uma rota parcial da GGCheckout, mas ela contém nomes de eventos e campos não comprovados pela documentação oficial;
- o segredo esperado pelo código tem nome diferente do solicitado;
- a compra é vinculada ao usuário apenas por e-mail;
- não existe idempotência nem histórico de eventos;
- cancelamento e ordem cronológica dos eventos não são tratados com segurança;
- qualquer usuário autenticado continua usando todas as funções, independentemente da assinatura;
- existem relações financeiras que não garantem no banco que `account_id` e `user_id` pertençam ao mesmo dono.

**Recomendação:** não ativar o webhook atual. Primeiro obter da GGCheckout o contrato real de recorrência e definir um vínculo autenticado entre checkout e usuário. Depois, substituir a implementação parcial por uma integração transacional, idempotente e com bloqueio no banco.

---

## A. Arquitetura atual

- Aplicativo full-stack em React 19 + TanStack Start.
- Backend de aplicação no próprio TanStack Start.
- Lovable Cloud gerencia autenticação, banco PostgreSQL e segredos.
- Leituras e escritas financeiras atuais são feitas pelo navegador usando a sessão autenticada e protegidas por RLS.
- Operações privilegiadas usam uma credencial exclusiva do servidor.
- Não há Edge Functions no projeto e não há razão técnica para criar uma neste stack.
- O local correto para um webhook externo é uma rota pública do servidor em `/api/public/...`, com autenticação própria dentro do handler.

## B. Banco de dados atual

Foram confirmadas seis tabelas públicas com RLS ligada:

1. `profiles`
2. `accounts`
3. `categories`
4. `transactions`
5. `recurring_transactions`
6. `subscriptions`

A tabela `subscriptions` já contém:

- `id`
- `user_id` único
- `plan`: `monthly` ou `yearly`
- `status`: `active`, `canceled` ou `past_due`
- `gateway_subscription_id`
- `gateway_customer_id`
- `started_at`
- `current_period_end`
- `created_at`
- `updated_at`

Ela está vazia. A estrutura ainda não representa adequadamente todos os estados e eventos necessários para recorrência, auditoria e idempotência.

## C. Autenticação atual

- Login com Google pelo serviço gerenciado da Lovable.
- Login, cadastro e recuperação por e-mail e senha.
- A área interna valida o usuário com `getUser()` antes de liberar as rotas.
- Chamadas autenticadas ao backend possuem suporte para anexar e validar o token do usuário.
- Um gatilho cria o perfil e a conta financeira inicial após o cadastro.

A autenticação comprova **quem é o usuário**. Hoje ela não comprova **se esse usuário possui acesso pago válido**.

## D. Isolamento atual entre usuários

### O que está protegido

As políticas atuais restringem:

- perfil: somente o próprio `id`;
- contas: somente linhas com `auth.uid() = user_id`;
- lançamentos: somente linhas com `auth.uid() = user_id`;
- recorrências: somente linhas com `auth.uid() = user_id`;
- categorias pessoais: somente o proprietário; categorias globais são compartilhadas de propósito;
- assinatura: cada usuário pode ler somente a própria linha.

Usuários comuns não possuem uma política que permita inserir, editar ou excluir assinaturas. Portanto, alterar o navegador ou chamar diretamente a API não libera uma assinatura por si só.

### Lacuna relacional

As políticas verificam o `user_id` da própria linha, mas o banco não garante que o `account_id` informado em um lançamento ou recorrência pertença ao mesmo `user_id`. O UUID torna exploração casual difícil, mas isso não é uma garantia de segurança. Devem existir invariantes relacionais compostas ou validação equivalente no banco.

Também faltam vínculos de integridade de `accounts.user_id` e `subscriptions.user_id` com o usuário autenticado.

## E. Vulnerabilidades e riscos encontrados

### Críticos/altos

1. **Acesso pago não é aplicado no backend.** A assinatura aparece apenas em Configurações. Usuários sem pagamento, cancelados ou inadimplentes continuam com acesso integral.
2. **Vínculo da compra apenas por e-mail.** O e-mail digitado no checkout não é prova segura de vínculo com uma conta autenticada.
3. **Webhook atual contém contrato presumido.** Eventos como `subscription.canceled`, campos `subscription.id` e datas de período não foram encontrados na documentação oficial pública.
4. **Sem idempotência.** Reentregas podem processar o mesmo evento novamente.
5. **Sem proteção contra eventos fora de ordem.** Um evento antigo pode sobrescrever um estado mais novo e reativar ou bloquear uma assinatura incorretamente.

### Médios

6. **Sem trilha de auditoria.** Não há registro imutável do evento recebido, resultado, horário, tentativa ou erro.
7. **Atualização por usuário, não por assinatura externa.** Cancelamentos e falhas podem atingir a assinatura errada após troca de plano ou nova contratação.
8. **Estados insuficientes.** `active/canceled/past_due` não distingue cancelamento agendado, período expirado, pendência inicial, reembolso e eventual chargeback.
9. **Nome do segredo divergente.** O pedido define `GGCHECKOUT_WEBHOOK_SECRET`; o código atual procura `GG_CHECKOUT_WEBHOOK_SECRET`.
10. **Dependências.** A varredura encontrou duas vulnerabilidades de alta severidade em uma dependência transitiva de processamento YAML trazida pelo framework. Isso deve ser tratado separadamente, sem misturar com a integração de cobrança.

### Observação sobre o scanner

O linter atual do banco não retornou problemas. Um alerta antigo sobre escrita em `subscriptions` está desatualizado: embora os papéis tenham permissões de tabela amplas herdadas, a RLS não possui políticas de escrita para usuários e bloqueia essas operações. Ainda assim, os privilégios devem ser reduzidos explicitamente para defesa em profundidade e clareza operacional.

## F. Estrutura recomendada de assinatura

### `subscriptions`

Manter uma assinatura corrente por usuário, ampliando para:

- `id`
- `user_id` com referência ao usuário e exclusão em cascata
- `provider` = `ggcheckout`
- `plan` = `monthly | yearly`
- `status` = `pending | active | past_due | canceled | expired | refunded`
- `access_until` — data efetiva até a qual o acesso permanece válido
- `cancel_at_period_end` — cancelou, mas ainda está no período pago
- `current_period_start`
- `current_period_end`
- `external_subscription_id` único, quando a GGCheckout realmente fornecer esse ID
- `external_customer_id`, se documentado
- `last_event_at`
- `created_at`, `updated_at`

A autorização deve usar uma regra derivada: acesso válido somente quando o estado permite e `access_until/current_period_end` ainda não venceu. O evento bruto nunca deve conceder acesso sem validação.

### `billing_webhook_events`

Tabela somente do servidor para auditoria e idempotência:

- `id`
- `provider`
- `external_event_id` único, se existir
- fallback determinístico quando não existir ID de evento
- `event_type`
- `external_payment_id`
- `external_subscription_id`
- `received_at`
- `provider_created_at`
- `payload` JSON
- `payload_hash`
- `processing_status`
- `processed_at`
- `error_code`
- `attempt_count`

Nenhum usuário comum deve ler ou escrever essa tabela.

### `checkout_links` ou `purchase_intents`

Necessária se a GGCheckout aceitar metadado/referência externa:

- referência aleatória e de uso único;
- `user_id` autenticado;
- plano esperado;
- produto/checkout esperado;
- validade e consumo;
- nunca confiar em preço, plano ou usuário vindos apenas do navegador.

## G. Fluxo completo recomendado

```text
Usuário cria conta ou entra
  → backend cria uma intenção de compra vinculada ao user_id e ao plano
  → backend gera/compõe o checkout com referência externa segura
  → GGCheckout cobra via Mercado Pago
  → GGCheckout envia evento ao endpoint público
  → backend valida o segredo/assinatura oficial e o corpo bruto
  → registra o evento e elimina duplicatas
  → confere produto, valor, moeda, referência e IDs externos
  → localiza o user_id pela referência segura, não pelo e-mail
  → atualiza assinatura e período numa única transação
  → RLS/função de autorização passa a liberar os dados pagos
```

Se a GGCheckout não permitir metadado ou referência externa, será necessário escolher um fluxo alternativo antes da implementação. O mais seguro é exigir login antes do checkout. E-mail pode servir para reconciliação manual, nunca como vínculo primário automático.

## H. Fluxo de cancelamento

```text
GGCheckout informa cancelamento com ID e fim do período
  → webhook autentica e deduplica o evento
  → localiza a assinatura pelo ID externo
  → marca canceled + cancel_at_period_end
  → mantém acesso até access_until/current_period_end
  → após o vencimento, a regra do banco nega o acesso pago
  → usuário, perfil e dados financeiros permanecem intactos
```

Se houver reembolso/chargeback com revogação imediata, a regra deve seguir o contrato da GGCheckout e a política comercial definida. Um cancelamento nunca deve apagar usuário, conta ou lançamentos.

## I. Funções de backend necessárias

1. **Endpoint público GGCheckout** em rota TanStack, preferencialmente `/api/public/webhooks/ggcheckout`.
2. **Validador do webhook** conforme o mecanismo oficial confirmado.
3. **Processador transacional e idempotente** de eventos.
4. **Criador autenticado de intenção de compra/checkout**, se a GGCheckout suportar referência externa.
5. **Leitor autenticado do direito de acesso**, sem retornar dados internos de auditoria.
6. **Reconciliação administrativa agendada ou manual**, somente se a API da GGCheckout permitir consultar o estado real.

Não criar Edge Function para isso; neste projeto ela duplicaria o backend existente.

## J. Tabelas e campos a criar/modificar

- Evoluir `subscriptions` com estados, período, acesso efetivo, provedor, IDs externos e controle de ordenação.
- Criar `billing_webhook_events`.
- Criar `purchase_intents` apenas se o checkout suportar referência externa ou criação por API.
- Adicionar referências de `accounts.user_id` e `subscriptions.user_id` ao usuário.
- Reforçar a coerência dono-conta em `transactions` e `recurring_transactions` com chave composta ou validação equivalente.
- Criar índices únicos nos IDs externos realmente fornecidos pela GGCheckout.

Nenhuma alteração deve ser feita até conhecer o payload real e validar dados existentes antes de adicionar restrições.

## K. Políticas RLS e regras de segurança

- `subscriptions`: usuário autenticado lê apenas a própria assinatura; sem escrita pelo cliente.
- `billing_webhook_events`: nenhuma política para navegador; acesso exclusivo do backend.
- `purchase_intents`: usuário lê/cria somente a própria intenção por função autenticada; não define estado de pagamento.
- Dados financeiros: manter isolamento por proprietário e adicionar condição backend de acesso pago válido.
- Perfil e leitura da própria assinatura devem continuar disponíveis para mostrar o motivo do bloqueio e permitir suporte/saída.
- Toda decisão de acesso deve ocorrer no banco ou em função autenticada do servidor. A interface apenas reflete a decisão.
- A credencial privilegiada nunca participa de leituras comuns nem decide identidade do usuário.

## L. Armazenamento do `GGCHECKOUT_WEBHOOK_SECRET`

Será guardado exclusivamente no cofre de segredos do Lovable Cloud com o nome exato `GGCHECKOUT_WEBHOOK_SECRET`, lido apenas dentro do handler no servidor. Não será incluído em variáveis `VITE_*`, frontend, banco, localStorage, respostas, logs ou repositório.

A documentação oficial localizada afirma que, ao configurar um segredo, a GGCheckout envia `Authorization: Bearer <secret>` e `x-secret: <secret>`, e tenta novamente até três vezes quando há falha: [documentação oficial de webhooks](https://docs.ggcheckout.com/en/help/vendedor/integracoes/webhooks-personalizados). Não há confirmação oficial pública de HMAC; portanto, HMAC não será inventado. A implementação deverá seguir exatamente os cabeçalhos observados em um teste real.

## M. Informações ainda necessárias da GGCheckout

1. Exportação ou captura real dos cabeçalhos e corpo de teste de cada evento.
2. Lista exata de eventos de recorrência: ativação, renovação, cancelamento, falha, expiração, reembolso e chargeback.
3. Identificador único e estável do evento para idempotência.
4. Identificador estável da assinatura e do cliente.
5. Data/hora do evento e regra de ordenação.
6. Campos de início e fim do período pago.
7. Suporte a `metadata` ou referência externa na URL/API do checkout.
8. IDs exatos dos dois produtos/checkouts e valores/moeda esperados.
9. Política de retries, timeout e códigos HTTP aceitos.
10. API para consultar/reconciliar uma assinatura e sua autenticação.
11. Comportamento de cancelamento: imediato ou ao fim do período.
12. Regras de retentativa de cobrança e quando uma assinatura vira expirada.

A documentação oficial pública encontrada lista apenas eventos de pagamento como `pix.paid`, `pix.failed`, `pix.refunded`, `card.paid`, `card.failed`, `card.pending` e equivalentes; ela não documenta eventos de ciclo de assinatura nem os campos necessários. A oferta de SaaS afirma suportar recorrência e webhooks, mas não publica o contrato técnico: [página oficial para SaaS](https://www.ggcheckout.com/pt/para-saas).

## N. Informações ainda necessárias do Mercado Pago

A princípio, **nenhuma credencial nem webhook direto** deve ser configurado no Fluxo App. A GGCheckout deve intermediar o gateway e normalizar os eventos.

Antes de confirmar isso em produção, a GGCheckout precisa informar:

- se ela recebe e consolida todos os eventos de recorrência do Mercado Pago;
- se cancelamento e falhas de renovação chegam pelo webhook da GGCheckout;
- se IDs nativos do Mercado Pago são expostos para reconciliação;
- se algum webhook adicional do Mercado Pago é obrigatório.

Só integrar diretamente com Mercado Pago se a GGCheckout declarar formalmente que não cobre parte indispensável do ciclo. Duas fontes concorrentes de verdade aumentariam risco de eventos fora de ordem.

## O. Vínculo comprador → assinatura → usuário

**Melhor opção:** login obrigatório antes de sair para o checkout. O backend gera uma referência opaca ligada a `user_id + plano + validade`; a GGCheckout devolve essa referência no webhook. O backend valida referência, produto e pagamento e então atualiza a assinatura.

**Não recomendado como vínculo primário:** procurar usuário pelo e-mail do comprador. E-mails podem divergir, conter erro ou pertencer a outra conta. E-mail será apenas dado auxiliar para investigação.

Se os checkouts estáticos atuais não aceitam referência externa, será preciso confirmar se podem receber um parâmetro seguro ou ser criados via API. Sem isso, a arquitetura comercial deve incluir cadastro/login antes da compra ou um processo explícito de reivindicação e verificação posterior.

## P. Plano de implementação em etapas

### Etapa 0 — contrato com a GGCheckout
- Obter documentação privada/suporte e payloads reais de teste.
- Confirmar referência externa, eventos, IDs, períodos e autenticação.
- Definir a política comercial de falha, cancelamento, reembolso e chargeback.

### Etapa 1 — endurecimento do modelo
- Validar dados existentes.
- Migrar `subscriptions` e criar auditoria/idempotência.
- Corrigir referências de proprietário e reduzir privilégios explícitos.
- Criar função única de autorização de assinatura.

### Etapa 2 — vínculo seguro da compra
- Implementar intenção de compra autenticada.
- Associar mensal a R$ 24,90 e anual a R$ 149,90 pelos IDs oficiais.
- Impedir que o navegador escolha livremente usuário, preço ou status.

### Etapa 3 — webhook
- Substituir a rota parcial atual pela rota canônica.
- Validar segredo conforme documentação real.
- Validar payload com esquema estrito.
- Deduplicar, ordenar e processar em transação.
- Registrar resultado para auditoria sem gravar segredos.

### Etapa 4 — bloqueio backend
- Aplicar a regra de acesso aos dados pagos no banco/funções autenticadas.
- Manter acesso mínimo ao perfil, assinatura, saída e recuperação.
- Não apagar dados após cancelamento.

### Etapa 5 — interface mínima necessária
- Somente depois da proteção backend, refletir estados de acesso, renovação e cancelamento sem reformular o design.

### Etapa 6 — publicação controlada
- Testar em ambiente de teste, publicar, configurar URL e segredo na GGCheckout e acompanhar entregas/reconciliação.

## Q. Testes antes da produção

### Segurança entre usuários
- Usuário A não lê, cria, altera ou exclui perfil, conta, categoria pessoal, lançamento, recorrência ou assinatura de B.
- Tentativas com IDs conhecidos de outro usuário falham no banco.
- Usuário não consegue alterar `status`, período ou plano da própria assinatura.

### Estados e acesso
- Sem assinatura, pendente, falha e expirada: acesso pago negado.
- Ativa: acesso liberado.
- Cancelada com período vigente: acesso até a data final.
- Cancelada após o período: bloqueio automático.
- Renovação amplia o período corretamente.
- Reembolso/chargeback segue a política definida.

### Webhook
- Segredo ausente, incorreto e cabeçalho malformado retornam falha sem escrita.
- Corpo inválido, produto errado, valor errado e referência desconhecida não concedem acesso.
- Evento repetido não altera o resultado nem duplica histórico.
- Eventos antigos ou fora de ordem não sobrescrevem estado novo.
- Falha no meio do processamento reverte toda a transação.
- Logs não expõem segredo nem dados financeiros desnecessários.
- Retries reais da GGCheckout funcionam e recebem respostas esperadas.

### Operação
- Compra mensal e anual reais em modo de teste.
- Renovação, recusa, cancelamento, fim do período e reembolso.
- Reconciliação entre painel GGCheckout e banco.
- Usuário preserva todos os dados ao perder acesso e os reencontra ao reativar.
- Teste de carga e limite de tempo no endpoint.
- Monitoramento e alerta para eventos sem usuário, produto desconhecido e falhas repetidas.

## Decisões bloqueadoras antes da implementação

1. A GGCheckout suporta referência externa/metadata vinculada ao checkout?
2. Quais são os eventos e payloads reais de assinatura?
3. Cancelamento encerra acesso imediatamente ou no final do período pago?
4. Qual é a política para falha de renovação: carência ou bloqueio imediato?
5. Reembolso e chargeback revogam acesso imediatamente?
6. A GGCheckout cobre integralmente os eventos do Mercado Pago?

Até essas respostas existirem, qualquer implementação do ciclo de recorrência dependeria de suposições e não deve ser publicada.
