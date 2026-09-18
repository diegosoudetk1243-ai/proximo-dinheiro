import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, LogOut, UserRound, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { AppShell, useSignOut } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MoneyInput } from "@/components/MoneyInput";
import { useFluxo, useUpdateInitialBalance, useUpdateProfile } from "@/lib/fluxo-data";
import { PLAN_LABEL, STATUS_LABEL, useSubscription } from "@/lib/subscription";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Fluxo App" },
      { name: "description", content: "Seu perfil, sua conta principal e sua saída." },
      { property: "og:title", content: "Configurações — Fluxo App" },
      { property: "og:description", content: "Ajuste seu nome e o saldo da sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <Configuracoes />
    </AppShell>
  ),
});

function Configuracoes() {
  const { data, isLoading } = useFluxo();
  const updateProfile = useUpdateProfile();
  const updateBalance = useUpdateInitialBalance();
  const signOut = useSignOut();
  const subscription = useSubscription();
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!data) return;
    setName(data.profile?.name ?? "");
    setBalance(Number(data.account?.initial_balance ?? 0));
  }, [data]);

  if (isLoading || !data) return <Skeleton className="h-64 rounded-3xl" />;

  async function handleSave() {
    try {
      await updateProfile.mutateAsync({ name: name.trim() });
      if (data?.account) {
        await updateBalance.mutateAsync({ accountId: data.account.id, balance });
      }
      toast.success("Tudo salvo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Sua conta</p>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Ajustes</h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel space-y-5 p-6">
          <div className="flex items-center gap-2 text-primary">
            <UserRound className="size-4" />
            <h2 className="text-sm font-semibold">Perfil</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-semibold uppercase text-muted-foreground">
              {data.profile?.avatar_url ? (
                <img src={data.profile.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                (data.profile?.name?.[0] ?? "F")
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{data.profile?.name ?? "Você"}</p>
              <p className="truncate text-sm text-muted-foreground">{data.profile?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 rounded-lg"
            />
          </div>
        </section>

        {data.account ? <section className="panel space-y-3 p-6">
          <div className="flex items-center gap-2 text-primary">
            <WalletCards className="size-4" />
            <h2 className="text-sm font-semibold">Conta principal</h2>
          </div>
          <p className="text-sm text-muted-foreground">{data.account?.name}</p>
          <Label htmlFor="saldo">Saldo inicial informado</Label>
          <MoneyInput id="saldo" value={balance} onChange={setBalance} className="text-2xl" />
          <p className="text-xs text-muted-foreground">
            É a partir daqui que o Fluxo App calcula seu caixa atual.
          </p>
        </section> : null}

        <section className="panel space-y-3 p-6">
          <div className="flex items-center gap-2 text-primary">
            <BadgeCheck className="size-4" />
            <h2 className="text-sm font-semibold">Assinatura</h2>
          </div>
          {subscription.isLoading ? (
            <Skeleton className="h-10 rounded-lg" />
          ) : subscription.data ? (
            <div className="space-y-1">
              <p className="text-sm font-medium">{PLAN_LABEL[subscription.data.plan]}</p>
              <p className="text-sm text-muted-foreground">
                {STATUS_LABEL[subscription.data.status]}
              </p>
              {subscription.data.current_period_end ? (
                <p className="text-xs text-muted-foreground">
                  Período informado até{" "}
                  {new Date(subscription.data.current_period_end).toLocaleDateString("pt-BR")}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem assinatura ativa no momento.</p>
          )}
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending || updateBalance.isPending}
          className="h-12 w-full rounded-lg sm:w-auto sm:px-8"
        >
          Salvar
        </Button>

        <Button
          variant="outline"
          onClick={() => void signOut()}
          className="h-12 w-full rounded-lg text-destructive sm:w-auto"
        >
          <LogOut className="size-4" /> Sair da conta
        </Button>
      </div>
    </div>
  );
}
