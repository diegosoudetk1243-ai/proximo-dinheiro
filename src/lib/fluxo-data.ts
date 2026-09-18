import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hasPaidAccess, type Subscription } from "./subscription";
import type { MovementType, Recurrence, Transaction } from "./projection";

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
};

export type Account = {
  id: string;
  name: string;
  initial_balance: number | string;
};

export type Category = { id: string; name: string; type: string };

export type FluxoData = {
  profile: Profile | null;
  account: Account | null;
  transactions: Transaction[];
  recurrences: Recurrence[];
  categories: Category[];
  hasPaidAccess: boolean;
};

export const FLUXO_KEY = ["fluxo"] as const;

async function fetchFluxo(): Promise<FluxoData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sessão expirada. Entre novamente.");
  const userId = userData.user.id;

  const [profileRes, subscriptionRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (profileRes.error || subscriptionRes.error) {
    throw new Error((profileRes.error ?? subscriptionRes.error)?.message);
  }

  const paidAccess = hasPaidAccess(subscriptionRes.data as Subscription | null);
  const [accountsRes, txRes, recRes, catRes] = paidAccess
    ? await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("transactions").select("*").eq("user_id", userId).order("date"),
        supabase.from("recurring_transactions").select("*").eq("user_id", userId),
        supabase.from("categories").select("id,name,type").order("name"),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];

  const firstError =
    profileRes.error || accountsRes.error || txRes.error || recRes.error || catRes.error;
  if (firstError) throw new Error(firstError.message);

  let profile = profileRes.data as Profile | null;
  if (!profile) {
    const { data: created, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: userData.user.email ?? null,
        name:
          (userData.user.user_metadata?.["full_name"] as string | undefined) ??
          userData.user.email?.split("@")[0] ??
          null,
        avatar_url: (userData.user.user_metadata?.["avatar_url"] as string | undefined) ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    profile = created as Profile;
  }

  let account = (accountsRes.data?.[0] ?? null) as Account | null;
  if (!account) {
    const { data: created, error } = await supabase
      .from("accounts")
      .insert({ user_id: userId, name: "Meu Caixa", initial_balance: 0 })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    account = created as Account;
  }

  return {
    profile,
    account,
    transactions: (txRes.data ?? []) as Transaction[],
    recurrences: (recRes.data ?? []) as Recurrence[],
    categories: (catRes.data ?? []) as Category[],
    hasPaidAccess: paidAccess,
  };
}

export function useFluxo() {
  return useQuery({ queryKey: FLUXO_KEY, queryFn: fetchFluxo, staleTime: 10_000 });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: FLUXO_KEY });
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

export type MovementInput = {
  type: MovementType;
  amount: number;
  description: string;
  date: string;
  categoryId: string | null;
  accountId: string;
  recurrence: null | {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    endMode: "never" | "date" | "count";
    endDate: string | null;
    occurrences: number | null;
  };
};

export function useCreateMovement() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: MovementInput) => {
      const userId = await currentUserId();
      if (input.recurrence) {
        const { error } = await supabase.from("recurring_transactions").insert({
          user_id: userId,
          account_id: input.accountId,
          type: input.type,
          amount: input.amount,
          description: input.description,
          category_id: input.categoryId,
          frequency: input.recurrence.frequency,
          start_date: input.date,
          end_date: input.recurrence.endMode === "date" ? input.recurrence.endDate : null,
          occurrences_limit:
            input.recurrence.endMode === "count" ? input.recurrence.occurrences : null,
        });
        if (error) throw new Error(error.message);
        return;
      }
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        account_id: input.accountId,
        type: input.type,
        amount: input.amount,
        description: input.description,
        date: input.date,
        category_id: input.categoryId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: MovementInput }) => {
      const { error } = await supabase
        .from("transactions")
        .update({
          type: input.type,
          amount: input.amount,
          description: input.description,
          date: input.date,
          category_id: input.categoryId,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

/** Skip a single occurrence of a recurrence. */
export function useSkipOccurrence() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ recurrenceId, date }: { recurrenceId: string; date: string }) => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select("exception_dates")
        .eq("id", recurrenceId)
        .single();
      if (error) throw new Error(error.message);
      const exceptions = [...(data.exception_dates ?? []), date];
      const { error: updateError } = await supabase
        .from("recurring_transactions")
        .update({ exception_dates: exceptions })
        .eq("id", recurrenceId);
      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: invalidate,
  });
}

/** Stop a recurrence from a given date onward. */
export function useStopRecurrence() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ recurrenceId, fromDate }: { recurrenceId: string; fromDate: string }) => {
      const end = new Date(fromDate + "T12:00:00");
      end.setDate(end.getDate() - 1);
      const endISO = end.toISOString().slice(0, 10);
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ end_date: endISO, occurrences_limit: null })
        .eq("id", recurrenceId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateInitialBalance() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ accountId, balance }: { accountId: string; balance: number }) => {
      const { error } = await supabase
        .from("accounts")
        .update({ initial_balance: balance })
        .eq("id", accountId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateProfile() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (patch: { name?: string; onboarding_completed?: boolean }) => {
      const userId = await currentUserId();
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}
