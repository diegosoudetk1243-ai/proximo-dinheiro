import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CalendarRange, Plus, Wallet } from "lucide-react";

import { AppShell, useMovementDialog } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFluxo } from "@/lib/fluxo-data";
import { computeProjection } from "@/lib/projection";
import { addDaysISO, formatBRL, formatMonthLabel, formatShortDate, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/fluxo")({
  head: () => ({
    meta: [
      { title: "Fluxo — Fluxo App" },
      { name: "description", content: "O caminho do seu dinheiro ao longo do tempo." },
      { property: "og:title", content: "Fluxo — Fluxo App" },
      { property: "og:description", content: "Veja o saldo depois de cada movimentação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <Fluxo />
    </AppShell>
  ),
});

function Fluxo() {
  const { data, isLoading } = useFluxo();
  const { openAdd } = useMovementDialog();
  const [until, setUntil] = useState(addDaysISO(todayISO(), 90));

  const projection = useMemo(() => {
    if (!data?.account) return null;
    return computeProjection(
      Number(data.account.initial_balance),
      data.transactions,
      data.recurrences,
      until,
    );
  }, [data, until]);

  if (isLoading || !projection) return <Skeleton className="h-64 rounded-3xl" />;

  let lastMonth = "";

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Projeção financeira</p>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">O caminho do seu dinheiro</h1>
      </header>

      <div className="panel grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-primary">
            <CalendarRange className="size-4" />
            <p className="text-sm font-semibold">Quanto vou ter até…</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha uma data para visualizar seu saldo projetado.
          </p>
        </div>
        <input
          type="date"
          value={until}
          onChange={(event) => setUntil(event.target.value)}
          className="h-11 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="panel min-w-0 p-4 md:p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="size-4" />
            <p className="eyebrow">Hoje</p>
          </div>
          <p className="num font-display mt-2 truncate text-lg font-semibold sm:text-2xl">
            {formatBRL(projection.currentBalance)}
          </p>
        </div>
        <ArrowRight className="size-5 shrink-0 text-primary" />
        <div className="panel min-w-0 border-primary/30 p-4 md:p-5">
          <p className="eyebrow text-primary">Na data escolhida</p>
          <p
            className={cn(
              "num font-display mt-2 truncate text-lg font-semibold sm:text-2xl",
              projection.projectedBalance < 0 && "text-destructive",
            )}
          >
            {formatBRL(projection.projectedBalance)}
          </p>
        </div>
      </div>

      {projection.timeline.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-sm font-medium">Seu fluxo ainda está vazio.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione o que vai entrar ou sair para começar a visualizar seu caixa.
          </p>
          <Button onClick={openAdd} className="mt-4 rounded-full">
            <Plus className="size-4" /> Adicionar movimentação
          </Button>
        </div>
      ) : (
        <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[1.55rem] before:top-10 before:w-px before:bg-border">
          {projection.timeline.map(({ movement, balance }) => {
            const month = formatMonthLabel(movement.date);
            const showMonth = month !== lastMonth;
            lastMonth = month;
            return (
              <li key={movement.key}>
                {showMonth && <p className="eyebrow mb-2 mt-5">{month}</p>}
                <div className="panel relative grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 p-4 transition hover:border-primary/30">
                  <span className="num z-10 w-14 text-xs font-semibold text-muted-foreground">
                    {formatShortDate(movement.date)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{movement.description}</p>
                    <p className="num text-xs text-muted-foreground">Saldo: {formatBRL(balance)}</p>
                  </div>
                  <span
                    className={cn(
                      "num text-sm font-semibold",
                      movement.type === "income" ? "text-success" : "text-destructive",
                    )}
                  >
                    {movement.type === "income" ? "+ " : "− "}
                    {formatBRL(movement.amount)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
