import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { AppShell, useSignOut } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MoneyInput } from "@/components/MoneyInput";
import { useFluxo, useUpdateInitialBalance, useUpdateProfile } from "@/lib/fluxo-data";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Fluxo App" },
      { name: "description", content: "Seu perfil, sua conta principal e sua saída." },
      { property: "og:title", content: "Configurações — Fluxo App" },
      { property: "og:description", content: "Ajuste seu nome e o saldo da sua conta." },
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
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">Configurações</h1>

      <section className="surface space-y-4 p-6">
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
            className="h-12 rounded-2xl"
          />
        </div>
      </section>

      <section className="surface space-y-3 p-6">
        <p className="text-sm font-semibold">Conta principal</p>
        <p className="text-sm text-muted-foreground">{data.account?.name}</p>
        <Label htmlFor="saldo">Saldo inicial informado</Label>
        <MoneyInput id="saldo" value={balance} onChange={setBalance} className="text-2xl" />
        <p className="text-xs text-muted-foreground">
          É a partir daqui que o Fluxo App calcula seu caixa atual.
        </p>
      </section>

      <Button
        onClick={handleSave}
        disabled={updateProfile.isPending || updateBalance.isPending}
        className="h-12 w-full rounded-2xl"
      >
        Salvar
      </Button>

      <Button
        variant="outline"
        onClick={() => void signOut()}
        className="h-12 w-full rounded-2xl text-destructive"
      >
        <LogOut className="size-4" /> Sair da conta
      </Button>
    </div>
  );
}
