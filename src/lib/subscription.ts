import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "canceled" | "past_due";

export type Subscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  gateway_subscription_id: string | null;
  gateway_customer_id: string | null;
  started_at: string;
  current_period_end: string | null;
};

export const SUBSCRIPTION_KEY = ["subscription"] as const;

export const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  monthly: "Plano Mensal",
  yearly: "Plano Anual",
};

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Ativa",
  canceled: "Cancelada",
  past_due: "Pagamento pendente",
};

async function fetchSubscription(): Promise<Subscription | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id,user_id,plan,status,gateway_subscription_id,gateway_customer_id,started_at,current_period_end",
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
