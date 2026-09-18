import { Link } from "@tanstack/react-router";
import { CreditCard, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Subscription } from "@/lib/subscription";
import { PLAN_LABEL, STATUS_LABEL } from "@/lib/subscription";

export function SubscriptionRequired({ subscription }: { subscription: Subscription | null }) {
  return (
    <section className="mx-auto max-w-xl py-8 text-center md:py-16">
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <LockKeyhole className="size-5" />
      </span>
      <p className="eyebrow mt-6">Acesso protegido</p>
      <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Assinatura válida necessária</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        Seus dados continuam preservados. O acesso ao caixa será restaurado quando sua assinatura
        estiver ativa e dentro do período válido.
      </p>

      <div className="panel mt-7 grid gap-3 p-5 text-left sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Plano mensal</p>
          <p className="num mt-1 font-display text-xl font-semibold">R$ 24,90</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Plano anual</p>
          <p className="num mt-1 font-display text-xl font-semibold">R$ 149,90</p>
        </div>
      </div>

      {subscription ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CreditCard className="size-4" />
          <span>
            {PLAN_LABEL[subscription.plan]} · {STATUS_LABEL[subscription.status]}
          </span>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Nenhuma assinatura foi vinculada à sua conta.
        </p>
      )}

      <Button asChild className="mt-7 h-11 rounded-lg px-6">
        <Link to="/configuracoes">Ver minha assinatura</Link>
      </Button>
    </section>
  );
}
