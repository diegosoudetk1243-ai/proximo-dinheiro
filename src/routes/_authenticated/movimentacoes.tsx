import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell, useMovementDialog } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteTransaction,
  useFluxo,
  useSkipOccurrence,
  useStopRecurrence,
} from "@/lib/fluxo-data";
import { buildMovements, type Movement } from "@/lib/projection";
import { addDaysISO, formatBRL, formatMonthLabel, formatShortDate, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/movimentacoes")({
  head: () => ({
    meta: [
      { title: "Movimentações — Fluxo App" },
      { name: "description", content: "Tudo que entrou e vai entrar, entrou e vai sair." },
      { property: "og:title", content: "Movimentações — Fluxo App" },
      { property: "og:description", content: "Edite ou exclua o que entra e o que sai." },
    ],
  }),
  component: () => (
    <AppShell>
      <Movimentacoes />
    </AppShell>
  ),
});

type PeriodFilter = "next" | "past" | "all";
type TypeFilter = "all" | "income" | "expense";

function Movimentacoes() {
  const { data, isLoading } = useFluxo();
  const { openAdd, openEdit } = useMovementDialog();
  const removeTransaction = useDeleteTransaction();
  const skipOccurrence = useSkipOccurrence();
  const stopRecurrence = useStopRecurrence();

  const [period, setPeriod] = useState<PeriodFilter>("next");
  const [type, setType] = useState<TypeFilter>("all");

  const movements = useMemo(() => {
    if (!data) return [];
    const today = todayISO();
    const from = period === "next" ? today : addDaysISO(today, -365);
    const to = period === "past" ? today : addDaysISO(today, 365);
    return buildMovements(data.transactions, data.recurrences, from, to).filter((movement) =>
      type === "all" ? true : movement.type === type,
    );
  }, [data, period, type]);

  async function handleDelete(movement: Movement) {
    try {
      if (movement.id) {
        await removeTransaction.mutateAsync(movement.id);
        toast.success("Movimentação excluída.");
        return;
      }
      if (!movement.recurrenceId) return;
      const all = window.confirm(
        "OK: excluir esta e as próximas ocorrências.\nCancelar: excluir somente esta ocorrência.",
      );
      if (all) {
        await stopRecurrence.mutateAsync({
          recurrenceId: movement.recurrenceId,
          fromDate: movement.date,
        });
        toast.success("Recorrência encerrada.");
      } else {
        await skipOccurrence.mutateAsync({
          recurrenceId: movement.recurrenceId,
          date: movement.date,
        });
        toast.success("Ocorrência removida.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir.");
    }
  }

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;

  let lastMonth = "";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Movimentações</h1>
        <p className="text-sm text-muted-foreground">Tudo que entra e sai do seu caixa.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["next", "Próximas"],
            ["past", "Passadas"],
            ["all", "Todas"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-medium transition",
              period === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-8 w-px bg-border" />
        {(
          [
            ["all", "Tudo"],
            ["income", "Entradas"],
            ["expense", "Saídas"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-medium transition",
              type === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {movements.length === 0 ? (
        <div className="surface p-8 text-center">
          <p className="text-sm font-medium">Nada por aqui ainda.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione o que vai entrar ou sair para começar a visualizar seu caixa.
          </p>
          <Button onClick={openAdd} className="mt-4 rounded-full">
            <Plus className="size-4" /> Adicionar movimentação
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {movements.map((movement) => {
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
                <div className="surface flex items-center gap-3 p-4">
                  <span className="num w-14 text-xs font-semibold text-muted-foreground">
                    {formatShortDate(movement.date)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{movement.description}</p>
                    {movement.virtual && (
                      <p className="text-xs text-muted-foreground">Recorrente</p>
                    )}
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
                  {movement.id && (
                    <button
                      type="button"
                      aria-label="Editar"
                      onClick={() =>
                        openEdit({
                          transactionId: movement.id!,
                          type: movement.type,
                          amount: movement.amount,
                          description: movement.description,
                          date: movement.date,
                          categoryId: movement.categoryId,
                        })
                      }
                      className="rounded-full p-2 text-muted-foreground transition hover:bg-muted"
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Excluir"
                    onClick={() => handleDelete(movement)}
                    className="rounded-full p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
