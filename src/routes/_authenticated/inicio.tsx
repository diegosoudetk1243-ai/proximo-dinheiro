import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Plus,
  Wallet,
} from "lucide-react";

import { AppShell, useMovementDialog } from "@/components/AppShell";
import { DataLoadError } from "@/components/DataLoadError";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const { data, isLoading, error, refetch } = useFluxo();
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-52 rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return <DataLoadError message={error.message} onRetry={() => void refetch()} />;
  }

  if (!projection) {
    return <DataLoadError onRetry={() => void refetch()} />;
  }

  const next = projection.future.slice(0, 6);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Resumo do seu caixa</p>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
          Quanto você tem hoje e no futuro
        </h1>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-sidebar p-6 shadow-soft md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Caixa atual</p>
              <p className="num font-display mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
                {formatBRL(projection.currentBalance)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Disponível agora</p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </span>
          </div>
        </div>

        <div className="panel p-6 md:p-7">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Caixa previsto</p>
              <p className="num font-display mt-3 text-3xl font-semibold sm:text-4xl">
                {formatBRL(projection.projectedBalance)}
              </p>
            </div>
            <div className="flex rounded-full bg-muted p-1">
              {HORIZONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDays(option)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    days === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {option} dias
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Previsão para os próximos {days} dias
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="panel p-4 md:p-5">
          <div className="flex items-center gap-2 text-success">
            <ArrowUpRight className="size-4" />
            <p className="text-xs font-semibold">Vai entrar</p>
          </div>
          <p className="num mt-3 text-base font-semibold text-success sm:text-xl">
            + {formatBRL(projection.incomingTotal)}
          </p>
        </div>
        <div className="panel p-4 md:p-5">
          <div className="flex items-center gap-2 text-destructive">
            <ArrowDownLeft className="size-4" />
            <p className="text-xs font-semibold">Vai sair</p>
          </div>
          <p className="num mt-3 text-base font-semibold text-destructive sm:text-xl">
            − {formatBRL(projection.outgoingTotal)}
          </p>
        </div>
      </section>

      {projection.negativeAt && (
        <section className="rounded-xl border border-warning/40 bg-warning/10 p-5">
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

      <section className="panel overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <CalendarDays className="size-5 shrink-0 text-primary" />
            <h2 className="truncate text-sm font-semibold">Próximos movimentos</h2>
          </div>
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
              <li
                key={movement.key}
                className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 transition hover:bg-muted/40"
              >
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
