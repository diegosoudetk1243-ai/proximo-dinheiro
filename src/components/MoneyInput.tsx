import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  autoFocus?: boolean;
  id?: string;
};

export function MoneyInput({ value, onChange, className, autoFocus, id }: Props) {
  return (
    <input
      id={id}
      inputMode="numeric"
      autoFocus={autoFocus}
      value={formatBRL(value)}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
        onChange(digits ? Number(digits) / 100 : 0);
      }}
      className={cn(
        "num font-display w-full rounded-xl border border-input bg-card px-4 py-4 text-center text-3xl font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10",
        className,
      )}
    />
  );
}
