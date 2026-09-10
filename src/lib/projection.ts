import { addDaysISO, parseDate, toISODate, todayISO } from "./format";

export type MovementType = "income" | "expense";

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  type: MovementType;
  amount: number | string;
  description: string;
  date: string;
  category_id: string | null;
  recurrence_id: string | null;
  status: string;
};

export type Recurrence = {
  id: string;
  user_id: string;
  account_id: string;
  type: MovementType;
  amount: number | string;
  description: string;
  category_id: string | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date: string | null;
  occurrences_limit: number | null;
  exception_dates: string[] | null;
};

export type Movement = {
  key: string;
  id: string | null;
  recurrenceId: string | null;
  type: MovementType;
  amount: number;
  description: string;
  date: string;
  categoryId: string | null;
  virtual: boolean;
};

function num(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function stepDate(iso: string, frequency: Recurrence["frequency"], index: number, anchorDay: number) {
  const start = parseDate(iso);
  const d = new Date(start);
  if (frequency === "daily") d.setDate(start.getDate() + index);
  if (frequency === "weekly") d.setDate(start.getDate() + index * 7);
  if (frequency === "monthly") {
    d.setDate(1);
    d.setMonth(start.getMonth() + index);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(anchorDay, lastDay));
  }
  if (frequency === "yearly") {
    d.setDate(1);
    d.setFullYear(start.getFullYear() + index);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(anchorDay, lastDay));
  }
  return toISODate(d);
}

const MAX_OCCURRENCES = 2000;

/** Expands a recurrence into virtual movements between fromISO and toISO (inclusive). */
export function expandRecurrence(rec: Recurrence, fromISO: string, toISO: string): Movement[] {
  const out: Movement[] = [];
  const exceptions = new Set(rec.exception_dates ?? []);
  const anchorDay = parseDate(rec.start_date).getDate();
  const limit = rec.occurrences_limit ?? MAX_OCCURRENCES;

  for (let i = 0; i < Math.min(limit, MAX_OCCURRENCES); i++) {
    const date = stepDate(rec.start_date, rec.frequency, i, anchorDay);
    if (rec.end_date && date > rec.end_date) break;
    if (date > toISO) break;
    if (date < fromISO) continue;
    if (exceptions.has(date)) continue;
    out.push({
      key: `rec:${rec.id}:${date}`,
      id: null,
      recurrenceId: rec.id,
      type: rec.type,
      amount: num(rec.amount),
      description: rec.description,
      date,
      categoryId: rec.category_id,
      virtual: true,
    });
  }
  return out;
}

/** All movements (concrete + expanded recurrences) in a window, sorted by date. */
export function buildMovements(
  transactions: Transaction[],
  recurrences: Recurrence[],
  fromISO: string,
  toISO: string,
): Movement[] {
  const concrete: Movement[] = transactions
    .filter((t) => t.date >= fromISO && t.date <= toISO)
    .map((t) => ({
      key: `tx:${t.id}`,
      id: t.id,
      recurrenceId: t.recurrence_id,
      type: t.type,
      amount: num(t.amount),
      description: t.description,
      date: t.date,
      categoryId: t.category_id,
      virtual: false,
    }));

  // A concrete transaction linked to a recurrence overrides that occurrence.
  const overridden = new Set(
    transactions.filter((t) => t.recurrence_id).map((t) => `${t.recurrence_id}:${t.date}`),
  );

  const virtual = recurrences
    .flatMap((r) => expandRecurrence(r, fromISO, toISO))
    .filter((m) => !overridden.has(`${m.recurrenceId}:${m.date}`));

  return [...concrete, ...virtual].sort((a, b) =>
    a.date === b.date ? a.description.localeCompare(b.description) : a.date < b.date ? -1 : 1,
  );
}

const EPOCH = "1900-01-01";

export type Projection = {
  today: string;
  currentBalance: number;
  incomingTotal: number;
  outgoingTotal: number;
  projectedBalance: number;
  future: Movement[];
  timeline: { movement: Movement; balance: number }[];
  negativeAt: { date: string; balance: number; movement: Movement } | null;
};

/**
 * Deterministic cash engine.
 * currentBalance = initial balance + realized (date <= today)
 * projectedBalance = currentBalance + future incomes - future expenses (until horizon)
 */
export function computeProjection(
  initialBalance: number,
  transactions: Transaction[],
  recurrences: Recurrence[],
  horizonISO: string,
): Projection {
  const today = todayISO();
  const realized = buildMovements(transactions, recurrences, EPOCH, today);
  const currentBalance = realized.reduce(
    (acc, m) => acc + (m.type === "income" ? m.amount : -m.amount),
    initialBalance,
  );

  const future =
    horizonISO >= today
      ? buildMovements(transactions, recurrences, addDaysISO(today, 1), horizonISO)
      : [];

  const incomingTotal = future
    .filter((m) => m.type === "income")
    .reduce((a, m) => a + m.amount, 0);
  const outgoingTotal = future
    .filter((m) => m.type === "expense")
    .reduce((a, m) => a + m.amount, 0);

  let running = currentBalance;
  const timeline = future.map((movement) => {
    running += movement.type === "income" ? movement.amount : -movement.amount;
    return { movement, balance: running };
  });

  const negative = timeline.find((t) => t.balance < 0) ?? null;

  return {
    today,
    currentBalance,
    incomingTotal,
    outgoingTotal,
    projectedBalance: currentBalance + incomingTotal - outgoingTotal,
    future,
    timeline,
    negativeAt: negative
      ? { date: negative.movement.date, balance: negative.balance, movement: negative.movement }
      : null,
  };
}
