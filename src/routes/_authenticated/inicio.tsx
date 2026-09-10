import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Plus } from "lucide-react";

import { AppShell, useMovementDialog } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFluxo } from "@/lib/fluxo-data";
import { computeProjection } from "@/lib/projection";
import { addDaysISO, formatBRL, formatDayMonth, formatShortDate, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início — Fluxo App" },
      { name: "description", content: "Veja quanto você tem hoje e quanto terá amanhã." },
      { property: "og:title", content: "Início — Fluxo App" },
      { property: "og:description", content: "Seu caixa atual e o caixa previsto, sem contas." },
    ],
  }),
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

const HORIZONS = [7, 30, 90] as const;

function Dashboard() {
  const { data, isLoading, error } = useFluxo();
  const { openAdd } = useMovementDialog();
  const navigate = useNavigate();
  const [days, setDays] = useState<number>(30);

  const projection = useMemo(() => {
    if (!data?.account) return null;
    return computeProjection(
      Number(data.account.initial_balance),
      data.transactions,
      data.recurrences,
      addDaysISO(todayISO(), days),
    );
  }, [data, days]);

  if (data?.profile && !data.profile.onboarding_completed) {
    navigate({ to: "/onboarding", replace: true });
  }

  if (isLoading || !projection) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-52 rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  }

  const next = projection.future.slice(0, 6);

  return (
    <div className="space-y-5">
      <section className="surface p-6">
        <p className="text-sm text-muted-foreground">Caixa atual</p>
        <p className="num mt-1 text-4xl font-bold">{formatBRL(projection.currentBalance)}</p>
        <p className="mt-1 text-sm text-muted-foreground">Disponível agora</p>
      </section>

      <section className="surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Caixa previsto</p>
          <div className="flex rounded-full bg-muted p-1">
            {HORIZONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  days === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {option} dias
              </button>
            ))}
          </div>
        </div>

        <p
          className={cn(
            "num mt-2 text-4xl font-bold",
            projection.projectedBalance < 0 && "text-destructive",
          )}
        >
          {formatBRL(projection.projectedBalance)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Previsão para os próximos {days} dias
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-success/10 p-4">
            <p className="text-xs text-muted-foreground">Vai entrar</p>
            <p className="num mt-1 text-lg font-semibold text-success">
              + {formatBRL(projection.incomingTotal)}
            </p>
          </div>
          <div className="rounded-2xl bg-destructive/10 p-4">
            <p className="text-xs text-muted-foreground">Vai sair</p>
            <p className="num mt-1 text-lg font-semibold text-destructive">
              − {formatBRL(projection.outgoingTotal)}
            </p>
          </div>
        </div>
      </section>

      {projection.negativeAt && (
        <section className="rounded-3xl border border-warning/40 bg-warning/10 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
            <AlertTriangle className="size-4" /> Atenção
          </p>
          <p className="mt-2 text-sm text-warning-foreground">
            Seu caixa ficará negativo em {formatDayMonth(projection.negativeAt.date)}.
          </p>
          <p className="num mt-1 text-xl font-bold text-destructive">
            {formatBRL(projection.negativeAt.balance)}
          </p>
          <p className="mt-1 text-xs text-warning-foreground/80">
            Causado por: {projection.negativeAt.movement.description}
          </p>
        </section>
      )}

      <section className="surface p-2">
        <div className="flex items-center justify-between px-4 pt-3">
          <h2 className="text-sm font-semibold">Próximos movimentos</h2>
          <Link to="/movimentacoes" className="text-xs text-primary">
            Ver todos
          </Link>
        </div>

        {next.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium">Seu fluxo ainda está vazio.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione o que vai entrar ou sair para começar a visualizar seu caixa.
            </p>
            <Button onClick={openAdd} className="mt-4 rounded-full">
              <Plus className="size-4" /> Adicionar movimentação
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {next.map((movement) => (
              <li key={movement.key} className="flex items-center gap-4 px-4 py-4">
                <span className="num w-14 text-xs font-semibold text-muted-foreground">
                  {formatShortDate(movement.date)}
                </span>
                <span className="flex-1 truncate text-sm">{movement.description}</span>
                <span
                  className={cn(
                    "num text-sm font-semibold",
                    movement.type === "income" ? "text-success" : "text-destructive",
                  )}
                >
                  {movement.type === "income" ? "+ " : "− "}
                  {formatBRL(movement.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
