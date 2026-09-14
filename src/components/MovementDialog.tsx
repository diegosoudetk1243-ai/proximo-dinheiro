import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/MoneyInput";
import { cn } from "@/lib/utils";
import { todayISO } from "@/lib/format";
import {
  useCreateMovement,
  useUpdateTransaction,
  type Category,
  type MovementInput,
} from "@/lib/fluxo-data";
import type { MovementType } from "@/lib/projection";

export type EditingMovement = {
  transactionId: string;
  type: MovementType;
  amount: number;
  description: string;
  date: string;
  categoryId: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  categories: Category[];
  editing?: EditingMovement | null;
};

type Frequency = "daily" | "weekly" | "monthly" | "yearly";

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "monthly", label: "Mensalmente" },
  { value: "yearly", label: "Anualmente" },
];

export function MovementDialog({ open, onOpenChange, accountId, categories, editing }: Props) {
  const [type, setType] = useState<MovementType>("expense");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [repeats, setRepeats] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [endMode, setEndMode] = useState<"never" | "date" | "count">("never");
  const [endDate, setEndDate] = useState("");
  const [occurrences, setOccurrences] = useState("12");

  const create = useCreateMovement();
  const update = useUpdateTransaction();
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    setType(editing?.type ?? "expense");
    setAmount(editing?.amount ?? 0);
    setDescription(editing?.description ?? "");
    setDate(editing?.date ?? todayISO());
    setCategoryId(editing?.categoryId ?? null);
    setRepeats(false);
    setFrequency("monthly");
    setEndMode("never");
    setEndDate("");
    setOccurrences("12");
  }, [open, editing]);

  async function handleSubmit() {
    if (amount <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    if (!description.trim()) {
      toast.error("Escreva uma descrição.");
      return;
    }

    const input: MovementInput = {
      type,
      amount,
      description: description.trim(),
      date,
      categoryId,
      accountId,
      recurrence: repeats
        ? {
            frequency,
            endMode,
            endDate: endDate || null,
            occurrences: Number(occurrences) > 0 ? Number(occurrences) : null,
          }
        : null,
    };

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.transactionId, input });
        toast.success("Movimentação atualizada.");
      } else {
        await create.mutateAsync(input);
        toast.success("Movimentação adicionada.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card sm:max-w-md sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editing ? "Editar movimentação" : "O que aconteceu?"}
          </DialogTitle>
          <DialogDescription>Leva poucos segundos.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType("income")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-4 py-4 text-sm font-semibold transition",
              type === "income"
                ? "border-success bg-success/10 text-success"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            <ArrowUpRight className="size-4" /> ENTROU
          </button>
          <button
            type="button"
            onClick={() => setType("expense")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-4 py-4 text-sm font-semibold transition",
              type === "expense"
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            <ArrowDownLeft className="size-4" /> SAIU
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">Valor</Label>
          <MoneyInput id="valor" value={amount} onChange={setAmount} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            placeholder="Mercado"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="h-12 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input
            id="data"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-12 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria (opcional)</Label>
          <select
            id="categoria"
            value={categoryId ?? ""}
            onChange={(event) => setCategoryId(event.target.value || null)}
            className="h-12 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {!editing && (
          <div className="space-y-3">
            <Label>Vai se repetir?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRepeats(false)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm font-medium transition",
                  !repeats ? "border-primary bg-primary/10 text-primary" : "border-border bg-card",
                )}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => setRepeats(true)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm font-medium transition",
                  repeats ? "border-primary bg-primary/10 text-primary" : "border-border bg-card",
                )}
              >
                Sim
              </button>
            </div>

            {repeats && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/60 p-3">
                <select
                  value={frequency}
                  onChange={(event) => setFrequency(event.target.value as Frequency)}
                  className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary"
                >
                  {FREQUENCIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <select
                  value={endMode}
                  onChange={(event) => setEndMode(event.target.value as typeof endMode)}
                  className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="never">Sem data final</option>
                  <option value="date">Até uma data</option>
                  <option value="count">Número de vezes</option>
                </select>

                {endMode === "date" && (
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="h-11 rounded-xl"
                  />
                )}
                {endMode === "count" && (
                  <Input
                    type="number"
                    min={1}
                    value={occurrences}
                    onChange={(event) => setOccurrences(event.target.value)}
                    className="h-11 rounded-xl"
                  />
                )}
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="h-13 w-full rounded-xl py-6 text-base font-semibold"
        >
          {saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar movimentação"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
