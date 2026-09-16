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
};

function getPlan(amount?: number): "monthly" | "yearly" | null {
  if (typeof amount !== "number") return null;

  if (Math.abs(amount - 24.9) < 0.01) return "monthly";
  if (Math.abs(amount - 149.9) < 0.01) return "yearly";

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
              JSON.stringify({ error: "webhook_not_configured" }),
              {
                status: 500,
                headers: { "content-type": "application/json" },
              },
            );
          }

          const authorization = request.headers.get("authorization");
          const xSecret = request.headers.get("x-secret");

          const expectedAuthorization = `Bearer ${secret}`;

          if (
            authorization !== expectedAuthorization &&
            xSecret !== secret
          ) {
            return new Response(
              JSON.stringify({ error: "unauthorized" }),
              {
                status: 401,
                headers: { "content-type": "application/json" },
              },
            );
          }

          const payload = (await request.json()) as WebhookPayload;

          const event = payload.event;
          const email = payload.customer?.email?.trim().toLowerCase();
          const paymentId = payload.payment?.id ?? null;
          const amount = payload.payment?.amount;

          if (!event || !email) {
            return new Response(
              JSON.stringify({ error: "invalid_payload" }),
              {
                status: 400,
                headers: { "content-type": "application/json" },
              },
            );
          }

          const supabaseUrl =
            process.env.SUPABASE_URL ??
            process.env.VITE_SUPABASE_URL;

          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !serviceRoleKey) {
            console.error(
              "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado.",
            );

            return new Response(
              JSON.stringify({ error: "server_not_configured" }),
              {
                status: 500,
                headers: { "content-type": "application/json" },
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
              JSON.stringify({ error: "user_lookup_failed" }),
              {
                status: 500,
                headers: { "content-type": "application/json" },
              },
            );
          }

          const user = usersData.users.find(
            (item) => item.email?.trim().toLowerCase() === email,
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
                headers: { "content-type": "application/json" },
              },
            );
          }

          const paidEvents = ["pix.paid", "card.paid"];
          const canceledEvents = ["subscription.canceled"];
          const pastDueEvents = ["subscription.past_due"];
          const refundedEvents = ["pix.refunded", "card.refunded"];

          if (paidEvents.includes(event)) {
            const plan = getPlan(amount);

            if (!plan) {
              return new Response(
                JSON.stringify({
                  error: "unknown_plan_amount",
                  amount,
                }),
                {
                  status: 400,
                  headers: { "content-type": "application/json" },
                },
              );
            }

            const { error } = await supabaseAdmin
              .from("subscriptions")
              .upsert(
                {
                  user_id: user.id,
                  plan,
                  status: "active",
                  gateway_subscription_id: paymentId,
                  gateway_customer_id: email,
                  started_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                {
                  onConflict: "user_id",
                },
              );

            if (error) {
              console.error(error);
              return new Response(
                JSON.stringify({ error: "subscription_update_failed" }),
                {
                  status: 500,
                  headers: { "content-type": "application/json" },
                },
              );
            }
          } else if (
            canceledEvents.includes(event) ||
            refundedEvents.includes(event)
          ) {
            const { error } = await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "canceled",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id);

            if (error) {
              console.error(error);
              return new Response(
                JSON.stringify({ error: "subscription_cancel_failed" }),
                {
                  status: 500,
                  headers: { "content-type": "application/json" },
                },
              );
            }
          } else if (pastDueEvents.includes(event)) {
            const { error } = await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id);

            if (error) {
              console.error(error);
              return new Response(
                JSON.stringify({ error: "subscription_past_due_failed" }),
                {
                  status: 500,
                  headers: { "content-type": "application/json" },
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
              headers: { "content-type": "application/json" },
            },
          );
        } catch (error) {
          console.error("GGCheckOut webhook error:", error);

          return new Response(
            JSON.stringify({ error: "internal_server_error" }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            },
          );
        }
      },
    },
  },
});
