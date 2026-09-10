const MONTHS = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

const MONTHS_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatSigned(value: number, type: "income" | "expense"): string {
  const sign = type === "income" ? "+ " : "− ";
  return sign + formatBRL(Math.abs(value));
}

/** ISO date string (YYYY-MM-DD) -> Date at local noon (avoids timezone drift). */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** 05 OUT */
export function formatShortDate(iso: string): string {
  const d = parseDate(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
}

/** 10/10/2026 */
export function formatFullDate(iso: string): string {
  const d = parseDate(iso);
  return d.toLocaleDateString("pt-BR");
}

/** Outubro 2026 */
export function formatMonthLabel(iso: string): string {
  const d = parseDate(iso);
  return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

/** "18 de outubro" */
export function formatDayMonth(iso: string): string {
  const d = parseDate(iso);
  return `${d.getDate()} de ${MONTHS_FULL[d.getMonth()]!.toLowerCase()}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Currency mask helpers: digits -> number */
export function digitsToAmount(digits: string): number {
  const clean = digits.replace(/\D/g, "");
  return clean ? Number(clean) / 100 : 0;
}

export function maskCurrencyInput(raw: string): string {
  const amount = digitsToAmount(raw);
  return formatBRL(amount);
}
