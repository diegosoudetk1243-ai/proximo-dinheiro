import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = "monthly" | "yearly";
export type SubscriptionStatus =
  "pending" | "active" | "past_due" | "canceled" | "expired" | "refunded";

export type Subscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: "ggcheckout";
  access_until: string | null;
  cancel_at_period_end: boolean;
  current_period_start: string | null;
  started_at: string;
  current_period_end: string | null;
  external_subscription_id: string | null;
  external_customer_id: string | null;
  last_event_at: string | null;
};

export const SUBSCRIPTION_KEY = ["subscription"] as const;

export const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  monthly: "Plano Mensal",
  yearly: "Plano Anual",
};

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  pending: "Pendente",
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  expired: "Expirada",
  refunded: "Reembolsada",
};

export function hasPaidAccess(subscription: Subscription | null | undefined) {
  if (!subscription || !["active", "canceled"].includes(subscription.status)) return false;
  const validUntil = subscription.access_until ?? subscription.current_period_end;
  return validUntil ? new Date(validUntil).getTime() > Date.now() : false;
}

async function fetchSubscription(): Promise<Subscription | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id,user_id,provider,plan,status,access_until,cancel_at_period_end,current_period_start,current_period_end,external_subscription_id,external_customer_id,last_event_at,started_at",
    )
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Subscription | null) ?? null;
}

export function useSubscription() {
  return useQuery({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: fetchSubscription,
    staleTime: 60_000,
  });
}
