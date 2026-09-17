import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type WebhookPayload = {
  event?: string;
  customer?: {
    email?: string;
  };
  payment?: {
    id?: string;
    status?: string;
    amount?: number;
  };
  product?: {
    id?: string;
    title?: string;
  };
  products?: Array<{
    id?: string;
    title?: string;
  }>;
  subscription?: {
    id?: string;
    current_period_end?: string;
    currentPeriodEnd?: string;
  };
};

const MONTHLY_PRODUCT_ID = "VndD70DOPnoNFHEtOcKY";
const YEARLY_PRODUCT_ID = "4eeI2xOa4ZjG0fFxWADl";

type Plan = "monthly" | "yearly";

function getPlan(payload: WebhookPayload): Plan | null {
  const productIds = [
    payload.product?.id,
    ...(payload.products ?? []).map((product) => product.id),
  ].filter(Boolean);

  if (productIds.includes(MONTHLY_PRODUCT_ID)) {
    return "monthly";
  }

  if (productIds.includes(YEARLY_PRODUCT_ID)) {
    return "yearly";
  }

  return null;
}

export const Route = createFileRoute("/api/public/webhooks/ggcheckauti")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const secret = process.env.GG_CHECKOUT_WEBHOOK_SECRET;

          if (!secret) {
            console.error("GG_CHECKOUT_WEBHOOK_SECRET não configurado.");

            return new Response(
              JSON.stringify({
                error: "webhook_not_configured",
              }),
              {
                status: 500,
                headers: {
                  "content-type": "application/json",
                },
              },
            );
          }

          const authorization = request.headers.get("authorization");
          const xSecret = request.headers.get("x-secret");

          const validAuthorization = authorization === `Bearer ${secret}`;
          const validXSecret = xSecret === secret;

          if (!validAuthorization && !validXSecret) {
            return new Response(
              JSON.stringify({
                error: "unauthorized",
              }),
              {
                status: 401,
                headers: {
                  "content-type": "application/json",
                },
              },
            );
          }

          const payload = (await request.json()) as WebhookPayload;

          const event = payload.event?.toLowerCase().trim();
          const email = payload.customer?.email?.trim().toLowerCase();

          if (!event || !email) {
            return new Response(
              JSON.stringify({
                error: "invalid_payload",
              }),
              {
                status: 400,
                headers: {
                  "content-type": "application/json",
                },
              },
            );
          }

          const supabaseUrl =
            process.env.SUPABASE_URL ??
            process.env.VITE_SUPABASE_URL;

          const serviceRoleKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !serviceRoleKey) {
            console.error(
              "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado.",
            );

            return new Response(
              JSON.stringify({
                error: "server_not_configured",
              }),
              {
                status: 500,
                headers: {
                  "content-type": "application/json",
                },
              },
            );
          }

          const supabaseAdmin = createClient(
            supabaseUrl,
            serviceRoleKey,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false,
              },
            },
          );

          const { data: usersData, error: usersError } =
            await supabaseAdmin.auth.admin.listUsers({
              page: 1,
              perPage: 1000,
            });

          if (usersError) {
            console.error(usersError);

            return new Response(
              JSON.stringify({
                error: "user_lookup_failed",
              }),
              {
                status: 500,
                headers: {
                  "content-type": "application/json",
                },
              },
            );
          }

          const user = usersData.users.find(
            (item) =>
              item.email?.trim().toLowerCase() === email,
          );

          if (!user) {
            return new Response(
              JSON.stringify({
                error: "user_not_found",
                message:
                  "Nenhum usuário do Fluxo App corresponde ao e-mail da compra.",
              }),
              {
                status: 404,
                headers: {
                  "content-type": "application/json",
                },
              },
            );
          }

          const paidEvents = [
            "pix.paid",
            "card.paid",
          ];

          const canceledEvents = [
            "subscription.canceled",
            "pix.refunded",
            "card.refunded",
          ];

          const pastDueEvents = [
            "subscription.past_due",
            "pix.failed",
            "card.failed",
          ];

          /*
           * PAGAMENTO APROVADO
           */
          if (paidEvents.includes(event)) {
            const plan = getPlan(payload);

            if (!plan) {
              return new Response(
                JSON.stringify({
                  error: "unknown_product",
                  message:
                    "O produto recebido não corresponde ao plano mensal ou anual do Fluxo App.",
                }),
                {
                  status: 400,
                  headers: {
                    "content-type": "application/json",
                  },
                },
              );
            }

            const subscriptionId =
              payload.subscription?.id ??
              null;

            const currentPeriodEnd =
              payload.subscription?.current_period_end ??
              payload.subscription?.currentPeriodEnd ??
              null;

            const { error } = await supabaseAdmin
              .from("subscriptions")
              .upsert(
                {
                  user_id: user.id,
                  plan,
                  status: "active",
                  gateway_subscription_id:
                    subscriptionId,
                  gateway_customer_id:
                    email,
                  started_at:
                    new Date().toISOString(),
                  current_period_end:
                    currentPeriodEnd,
                  updated_at:
                    new Date().toISOString(),
                },
                {
                  onConflict: "user_id",
                },
              );

            if (error) {
              console.error(error);

              return new Response(
                JSON.stringify({
                  error: "subscription_update_failed",
                }),
                {
                  status: 500,
                  headers: {
                    "content-type": "application/json",
                  },
                },
              );
            }
          }

          /*
           * CANCELAMENTO OU REEMBOLSO
           */
          else if (canceledEvents.includes(event)) {
            const { error } = await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "canceled",
                updated_at:
                  new Date().toISOString(),
              })
              .eq("user_id", user.id);

            if (error) {
              console.error(error);

              return new Response(
                JSON.stringify({
                  error: "subscription_cancel_failed",
                }),
                {
                  status: 500,
                  headers: {
                    "content-type": "application/json",
                  },
                },
              );
            }
          }

          /*
           * PAGAMENTO FALHOU / ASSINATURA ATRASADA
           */
          else if (pastDueEvents.includes(event)) {
            const { error } = await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "past_due",
                updated_at:
                  new Date().toISOString(),
              })
              .eq("user_id", user.id);

            if (error) {
              console.error(error);

              return new Response(
                JSON.stringify({
                  error: "subscription_past_due_failed",
                }),
                {
                  status: 500,
                  headers: {
                    "content-type": "application/json",
                  },
                },
              );
            }
          }

          return new Response(
            JSON.stringify({
              received: true,
              event,
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            },
          );
        } catch (error) {
          console.error(
            "GGCheckout webhook error:",
            error,
          );

          return new Response(
            JSON.stringify({
              error: "internal_server_error",
            }),
            {
              status: 500,
              headers: {
                "content-type": "application/json",
              },
            },
          );
        }
      },
    },
  },
});
