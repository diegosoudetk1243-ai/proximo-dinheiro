import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DataLoadError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <section className="panel flex flex-col items-center px-6 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-lg bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" />
      </span>
      <h1 className="mt-4 text-lg font-semibold">Não foi possível carregar seus dados</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {message ?? "Tente novamente. Se o problema continuar, entre novamente na sua conta."}
      </p>
      <Button type="button" variant="outline" className="mt-5" onClick={onRetry}>
        <RefreshCw className="size-4" /> Tentar novamente
      </Button>
    </section>
  );
}
