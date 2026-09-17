import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,

  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();

    // Usuário não está logado
    if (error || !data.user) {
      throw redirect({ to: "/" });
    }

    // Verifica se o usuário possui assinatura ativa
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("status, plan, current_period_end")
      .eq("user_id", data.user.id)
      .eq("status", "active")
      .maybeSingle();

    // Sem assinatura ativa = sem acesso ao SaaS
    if (subscriptionError || !subscription) {
      throw redirect({ to: "/" });
    }

    return {
      user: data.user,
      subscription,
    };
  },

  component: () => <Outlet />,
});
