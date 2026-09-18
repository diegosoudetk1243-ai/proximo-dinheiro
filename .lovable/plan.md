# Cobrança recorrente simples com Paddle

## Objetivo

Substituir a integração incompleta da GGCheckout pela cobrança nativa do Paddle, mantendo os planos:

- **Mensal:** R$ 24,90
- **Anual:** R$ 149,90

O Paddle foi verificado como compatível com o Fluxo App. O projeto também já está em um plano que permite ativar pagamentos.

## O que será feito

1. **Ativar Paddle em ambiente de teste**
   - Criar a integração oficial de pagamentos recorrentes.
   - Começar sem cobranças reais.

2. **Criar os dois planos**
   - Plano Mensal recorrente por R$ 24,90.
   - Plano Anual recorrente por R$ 149,90.
   - Não criar itens ou preços adicionais.

3. **Conectar a assinatura ao usuário autenticado**
   - O usuário entra no Fluxo App antes de comprar.
   - O checkout recebe uma referência segura da conta.
   - O navegador não poderá definir status, período ou acesso.

4. **Atualizar o controle de acesso existente**
   - Reaproveitar a tabela `subscriptions` e as proteções já implantadas.
   - Adaptar o provedor e os identificadores externos para Paddle sem apagar dados.
   - Atualizar assinatura somente pelo processamento seguro do servidor.
   - Preservar todos os dados financeiros após cancelamento ou vencimento.

5. **Cobrir o ciclo recorrente completo**
   - Ativação após pagamento confirmado.
   - Renovação e atualização do período.
   - Falha de pagamento.
   - Cancelamento no fim do período aplicável.
   - Expiração e reembolso conforme os eventos oficiais do Paddle.
   - Deduplicação e auditoria dos eventos recebidos.

6. **Adicionar compra e gestão na interface atual**
   - Botões para assinar o plano mensal ou anual.
   - Estado atual da assinatura em Configurações.
   - Acesso ao gerenciamento de cobrança e cancelamento.
   - Manter o visual atual, sem reformulação.

7. **Remover a dependência operacional da GGCheckout**
   - Desativar e remover a rota específica da GGCheckout após Paddle funcionar.
   - Remover referências e segredo antigos que deixarem de ser necessários.
   - Preservar registros históricos de auditoria, sem reutilizá-los para acesso.

8. **Validar antes de pagamentos reais**
   - Compra mensal e anual no ambiente de teste.
   - Renovação, cancelamento, falha, reembolso e evento repetido.
   - Usuário A nunca acessa ou altera assinatura/dados do usuário B.
   - Usuário não consegue fabricar uma assinatura ativa pelo navegador.

## Resultado

O Fluxo App terá checkout recorrente, renovação, cancelamento e controle de acesso em uma integração única e suportada, sem depender do payload incompleto da GGCheckout.

## Observação operacional

Depois dos testes, o Paddle solicitará verificação para liberar pagamentos reais. Como comerciante responsável pela cobrança, ele também cuida de impostos, reembolsos e contestações relacionados ao pagamento.
