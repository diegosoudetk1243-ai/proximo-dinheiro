import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

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
    <div className="space-y-5">
      <div className="surface flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h1 className="text-lg font-semibold">Fluxo</h1>
          <p className="text-sm text-muted-foreground">Quanto vou ter até…</p>
        </div>
        <input
          type="date"
          value={until}
          onChange={(event) => setUntil(event.target.value)}
          className="h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="surface p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Hoje</p>
        <p className="num text-2xl font-bold">{formatBRL(projection.currentBalance)}</p>
      </div>

      {projection.timeline.length === 0 ? (
        <div className="surface p-8 text-center">
          <p className="text-sm font-medium">Seu fluxo ainda está vazio.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione o que vai entrar ou sair para começar a visualizar seu caixa.
          </p>
          <Button onClick={openAdd} className="mt-4 rounded-full">
            <Plus className="size-4" /> Adicionar movimentação
          </Button>
        </div>
      ) : (
        <ol className="space-y-3">
          {projection.timeline.map(({ movement, balance }) => {
            const month = formatMonthLabel(movement.date);
            const showMonth = month !== lastMonth;
            lastMonth = month;
            return (
              <li key={movement.key}>
                {showMonth && (
                  <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {month}
                  </p>
                )}
                <div className="surface flex items-center gap-4 p-4">
                  <span className="num w-14 text-xs font-semibold text-muted-foreground">
                    {formatShortDate(movement.date)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{movement.description}</p>
                    <p className="num text-xs text-muted-foreground">
                      Saldo: {formatBRL(balance)}
                    </p>
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
