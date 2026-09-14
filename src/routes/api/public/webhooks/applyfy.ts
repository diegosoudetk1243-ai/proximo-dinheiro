import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint reservado para os webhooks de assinatura do Applyfy.
 *
 * Ainda NÃO está ativo de propósito: falta a chave de verificação de
 * assinatura do webhook, os nomes dos eventos, um exemplo do corpo enviado
 * e como identificar o usuário no payload. Enquanto isso, nada é lido,
 * gravado ou confiado — toda chamada é recusada.
 *
 * Quando essas informações chegarem, implementar nesta ordem:
 *  1. verificar a assinatura HMAC do cabeçalho contra o corpo bruto;
 *  2. validar o payload com Zod;
 *  3. mapear o checkout (mensal/anual) para `plan` e o evento para
 *     `active` | `canceled` | `past_due`;
 *  4. localizar o usuário e fazer upsert em `public.subscriptions`
 *     usando o cliente admin carregado dentro do handler.
 */
export const Route = createFileRoute("/api/public/webhooks/applyfy")({
  server: {
    handlers: {
      POST: async () =>
        new Response(
          JSON.stringify({
            error: "not_configured",
            message: "Webhook do Applyfy ainda não configurado.",
          }),
          { status: 501, headers: { "content-type": "application/json" } },
        ),
    },
  },
});
