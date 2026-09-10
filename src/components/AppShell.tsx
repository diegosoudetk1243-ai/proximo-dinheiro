import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Home, ListOrdered, Plus, Settings } from "lucide-react";

import { MovementDialog, type EditingMovement } from "@/components/MovementDialog";
import { useFluxo } from "@/lib/fluxo-data";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type AddContextValue = {
  openAdd: () => void;
  openEdit: (movement: EditingMovement) => void;
};

const AddContext = createContext<AddContextValue | null>(null);

export function useMovementDialog() {
  const context = useContext(AddContext);
  if (!context) throw new Error("useMovementDialog precisa estar dentro do AppShell");
  return context;
}

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/fluxo", label: "Fluxo", icon: ArrowLeftRight },
  { to: "/movimentacoes", label: "Movimentações", icon: ListOrdered },
  { to: "/configuracoes", label: "Ajustes", icon: Settings },
] as const;

export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data } = useFluxo();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditingMovement | null>(null);

  const value = useMemo<AddContextValue>(
    () => ({
      openAdd: () => {
        setEditing(null);
        setOpen(true);
      },
      openEdit: (movement) => {
        setEditing(movement);
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <AddContext.Provider value={value}>
      <div className="min-h-screen bg-background pb-28 md:pb-10">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
            <Link to="/inicio" className="text-base font-semibold tracking-tight">
              Fluxo App
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted"
                  activeProps={{ className: "bg-muted text-foreground font-medium" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              to="/configuracoes"
              className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground md:hidden"
            >
              {data?.profile?.avatar_url ? (
                <img src={data.profile.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                (data?.profile?.name?.[0] ?? "F")
              )}
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-5 py-6">{children}</main>

        <button
          type="button"
          onClick={value.openAdd}
          className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-float)] transition active:scale-95 md:bottom-8"
        >
          <Plus className="size-5" />
          <span className="hidden sm:inline">Adicionar movimentação</span>
        </button>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-[11px] text-muted-foreground transition",
                )}
                activeProps={{ className: "text-primary font-semibold" }}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {data?.account && (
          <MovementDialog
            open={open}
            onOpenChange={setOpen}
            accountId={data.account.id}
            categories={data.categories}
            editing={editing}
          />
        )}
      </div>
    </AddContext.Provider>
  );
}
