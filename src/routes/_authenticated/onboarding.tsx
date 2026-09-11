import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/MoneyInput";
import { supabase } from "@/integrations/supabase/client";
import { useFluxo, useUpdateInitialBalance, useUpdateProfile } from "@/lib/fluxo-data";
import { formatBRL, formatFullDate, todayISO } from "@/lib/format";
import type { MovementType } from "@/lib/projection";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "配Configurar seu caixa — Fluxo App".replace("配", "") },
      { name: "description", content: "Configure seu caixa em poucos passos." },
      { property: "og:title", content: "Configurar seu caixa — Fluxo App" },
      { property: "og:description", content: "Saldo atual, o que vai entrar e o que vai sair." },
    ],
  }),
  component: Onboarding,
});

type Draft = { description: string; amount: number; date: string };

function Onboarding() {
  const navigate = useNavigate();
  const { data } = useFluxo();
  const updateBalance = useUpdateInitialBalance();
  const updateProfile = useUpdateProfile();

  const [step, setStep] = useState(0);
  const [balance, setBalance] = useState(0);
  const [incomes, setIncomes] = useState<Draft[]>([]);
  const [expenses, setExpenses] = useState<Draft[]>([]);
  const [saving, setSaving] = useState(false);

  const totalIn = incomes.reduce((acc, item) => acc + item.amount, 0);
  const totalOut = expenses.reduce((acc, item) => acc + item.amount, 0);

  async function finish() {
    if (!data?.account) return;
    setSaving(true);
    try {
      await updateBalance.mutateAsync({ accountId: data.account.id, balance });

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const rows = [
        ...incomes.map((item) => ({ ...item, type: "income" as MovementType })),
        ...expenses.map((item) => ({ ...item, type: "expense" as MovementType })),
      ].filter((item) => item.amount > 0 && item.description.trim());

      if (userId && rows.length > 0) {
        const { error } = await supabase.from("transactions").insert(
          rows.map((row) => ({
            user_id: userId,
            account_id: data.account!.id,
            type: row.type,
            amount: row.amount,
            description: row.description.trim(),
            date: row.date,
          })),
        );
        if (error) throw new Error(error.message);
      }

      await updateProfile.mutateAsync({ onboarding_completed: true });
      setStep(4);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-between px-6 py-10">
      <div className="space-y-6">
        {step === 0 && (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold leading-tight">Bem-vindo ao Fluxo App 👋</h1>
            <p className="text-muted-foreground">
              Controle seu fluxo de caixa. Saiba quanto você tem hoje e quanto terá amanhã.
            </p>
            <p className="text-sm text-muted-foreground">Configure seu caixa em poucos passos.</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Quanto você tem hoje?</h1>
            <MoneyInput value={balance} onChange={setBalance} autoFocus />
            <p className="text-sm text-muted-foreground">
              Informe quanto dinheiro você tem disponível agora.
            </p>
          </div>
        )}

        {step === 2 && (
          <DraftStep
            title="Vai entrar algum dinheiro?"
            placeholder="Salário"
            items={incomes}
            onChange={setIncomes}
          />
        )}

        {step === 3 && (
          <DraftStep
            title="Vai sair algum dinheiro?"
            placeholder="Aluguel"
            items={expenses}
            onChange={setExpenses}
          />
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold">Seu caixa está configurado.</h1>
            <div className="surface space-y-4 p-6">
              <Row label="Caixa atual" value={formatBRL(balance)} />
              <Row label="Vai entrar" value={`+ ${formatBRL(totalIn)}`} tone="success" />
              <Row label="Vai sair" value={`− ${formatBRL(totalOut)}`} tone="destructive" />
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">Caixa previsto</p>
                <p className="num text-3xl font-bold">
                  {formatBRL(balance + totalIn - totalOut)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-3">
        {step === 0 && (
          <Button className="h-13 w-full rounded-2xl py-6" onClick={() => setStep(1)}>
            Começar
          </Button>
        )}
        {step === 1 && (
          <Button className="h-13 w-full rounded-2xl py-6" onClick={() => setStep(2)}>
            Continuar
          </Button>
        )}
        {(step === 2 || step === 3) && (
          <>
            <Button
              className="h-13 w-full rounded-2xl py-6"
              onClick={() => (step === 2 ? setStep(3) : void finish())}
              disabled={saving}
            >
              Continuar
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              disabled={saving}
              onClick={() => (step === 2 ? setStep(3) : void finish())}
            >
              Pular por enquanto
            </Button>
          </>
        )}
        {step === 4 && (
          <Button
            className="h-13 w-full rounded-2xl py-6"
            onClick={() => navigate({ to: "/inicio", replace: true })}
          >
            Ver meu caixa
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "destructive";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          "num font-semibold " +
          (tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "")
        }
      >
        {value}
      </span>
    </div>
  );
}

function DraftStep({
  title,
  placeholder,
  items,
  onChange,
}: {
  title: string;
  placeholder: string;
  items: Draft[];
  onChange: (items: Draft[]) => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayISO());

  function add() {
    if (!description.trim() || amount <= 0) {
      toast.error("Preencha descrição e valor.");
      return;
    }
    onChange([...items, { description: description.trim(), amount, date }]);
    setDescription("");
    setAmount(0);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{title}</h1>

      <div className="surface space-y-3 p-4">
        <div className="space-y-2">
          <Label htmlFor="desc">Descrição</Label>
          <Input
            id="desc"
            placeholder={placeholder}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="h-12 rounded-2xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valor">Valor</Label>
          <MoneyInput id="valor" value={amount} onChange={setAmount} className="text-2xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input
            id="data"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-12 rounded-2xl"
          />
        </div>
        <Button variant="secondary" className="w-full rounded-2xl" onClick={add}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item.description}-${index}`}
              className="surface flex items-center gap-3 p-3 text-sm"
            >
              <span className="flex-1 truncate">{item.description}</span>
              <span className="num font-medium">{formatBRL(item.amount)}</span>
              <span className="text-xs text-muted-foreground">{formatFullDate(item.date)}</span>
              <button
                type="button"
                aria-label="Remover"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="rounded-full p-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
