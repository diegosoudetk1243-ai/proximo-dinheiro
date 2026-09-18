import { createHash, timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import type { Json } from "@/integrations/supabase/types";

const documentedEvents = new Set([
  "pix.paid",
  "pix.generated",
  "pix.expired",
  "pix.failed",
  "pix.refunded",
  "card.paid",
  "card.expired",
  "card.failed",
  "card.refunded",
  "card.pending",
]);

const payloadSchema = z
  .object({
    event: z.string().trim().min(1).max(100),
    createdAt: z.string().datetime({ offset: true }),
    customer: z
      .object({
        name: z.string().max(300).optional(),
        email: z.string().email().max(320).optional(),
        document: z.string().max(100).optional(),
        phone: z.string().max(100).optional(),
        ip: z.string().max(100).optional(),
      })
      .passthrough()
      .optional(),
    payment: z
      .object({
        id: z.string().trim().min(1).max(300),
        method: z.string().max(100).optional(),
        paymentMethod: z.string().max(100).optional(),
        gateway: z.string().max(100).optional(),
        status: z.string().max(100).optional(),
        amount: z.number().finite().nonnegative().optional(),
      })
      .passthrough(),
    product: z
      .object({
        id: z.string().trim().min(1).max(300),
        type: z.string().max(100).optional(),
        title: z.string().max(500).optional(),
      })
      .passthrough(),
    products: z
      .array(
        z
          .object({
            id: z.string().trim().min(1).max(300),
            type: z.string().max(100).optional(),
            title: z.string().max(500).optional(),
            price: z.number().finite().nonnegative().optional(),
          })
          .passthrough(),
      )
      .max(100)
      .optional(),
    webhook: z
      .object({
        id: z.string().max(300).optional(),
        businessId: z.string().max(300).optional(),
        events: z.array(z.string().max(100)).max(100).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

function json(body: Record<string, unknown>, status: number) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function matchesSecret(received: string | null, expected: string) {
  if (!received) return false;
  const receivedBytes = new TextEncoder().encode(received);
  const expectedBytes = new TextEncoder().encode(expected);
  return (
    receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes)
  );
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export const Route = createFileRoute("/api/public/webhooks/ggcheckout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["GGCHECKOUT_WEBHOOK_SECRET"];
        if (!secret) return json({ error: "webhook_not_configured" }, 503);

        const authorization = request.headers.get("authorization");
        const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
        const headerSecret = request.headers.get("x-secret");
        if (!matchesSecret(bearer, secret) && !matchesSecret(headerSecret, secret)) {
          return json({ error: "unauthorized" }, 401);
        }

        const rawBody = await request.text();
        if (rawBody.length === 0 || rawBody.length > 1_000_000) {
          return json({ error: "invalid_payload" }, 400);
        }

        let unknownPayload: unknown;
        try {
          unknownPayload = JSON.parse(rawBody);
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        const parsed = payloadSchema.safeParse(unknownPayload);
        if (!parsed.success) return json({ error: "invalid_payload" }, 400);

        const payload = parsed.data;
        const eventType = payload.event.toLowerCase();
        const payloadHash = createHash("sha256").update(stableStringify(unknownPayload)).digest("hex");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("register_billing_webhook_event", {
          _external_event_id: "",
          _event_type: eventType,
          _external_payment_id: payload.payment.id,
          _external_subscription_id: "",
          _provider_created_at: payload.createdAt,
          _payload: JSON.parse(rawBody) as Json,
          _payload_hash: payloadHash,
        });

        if (error || !data?.[0]) return json({ error: "event_registration_failed" }, 500);
        const registration = data[0];
        if (!registration.is_new) return json({ received: true, duplicate: true }, 200);

        const errorCode = documentedEvents.has(eventType)
          ? "recurring_contract_not_documented"
          : "unsupported_event";

        const { error: updateError } = await supabaseAdmin
          .from("billing_webhook_events")
          .update({
            processing_status: "ignored",
            processed_at: new Date().toISOString(),
            error_code: errorCode,
          })
          .eq("id", registration.event_id);

        if (updateError) return json({ error: "event_audit_update_failed" }, 500);

        // A documentação pública não confirma referência externa do usuário,
        // IDs/períodos de assinatura nem eventos recorrentes. O evento é auditado,
        // mas nunca concede ou remove acesso até esse contrato ser confirmado.
        return json({ received: true, processed: false, reason: errorCode }, 202);
      },
    },
  },
});
