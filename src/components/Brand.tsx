import brandAsset from "@/assets/fluxo-app-icon.jpeg.asset.json";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <img
        src={brandAsset.url}
        alt="Símbolo do Fluxo App"
        className="size-10 shrink-0 rounded-xl object-cover shadow-brand"
      />
      {!compact && (
        <div className="min-w-0">
          <p className="font-display truncate text-base font-semibold text-foreground">Fluxo App</p>
          <p className="truncate text-[10px] font-semibold uppercase text-primary">Controle financeiro</p>
        </div>
      )}
    </div>
  );
}