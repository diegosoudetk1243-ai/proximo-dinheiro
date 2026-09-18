import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Home, ListOrdered, Plus, Settings } from "lucide-react";

import { MovementDialog, type EditingMovement } from "@/components/MovementDialog";
import { Brand } from "@/components/Brand";
import { useFluxo } from "@/lib/fluxo-data";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SubscriptionRequired } from "@/components/SubscriptionRequired";
import { hasPaidAccess, useSubscription } from "@/lib/subscription";

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
  const subscription = useSubscription();
  const location = useLocation();
  const settingsOpen = location.pathname === "/configuracoes";
  const paidAccess = hasPaidAccess(subscription.data);
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
      <div className="min-h-screen bg-background pb-28 md:grid md:grid-cols-[232px_minmax(0,1fr)] md:pb-0">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-sidebar-border bg-sidebar p-5 md:flex">
          <Link to="/inicio" className="px-2 py-2">
            <Brand />
          </Link>
          <nav className="mt-10 space-y-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                activeProps={{ className: "bg-sidebar-accent text-primary" }}
              >
                <item.icon className="size-5 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-sidebar-border px-2 pt-5">
            <p className="text-xs text-muted-foreground">Seu dinheiro em perspectiva.</p>
          </div>
        </aside>

        <div className="min-w-0 md:col-start-2">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
            <div className="mx-auto grid h-18 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 md:h-20 md:px-8">
              <Link to="/inicio" className="md:hidden">
                <Brand compact />
              </Link>
              <div className="hidden min-w-0 md:block">
                <p className="font-display truncate text-base font-semibold">Visão financeira</p>
                <p className="truncate text-xs text-muted-foreground">
                  Hoje e no futuro, em um só lugar.
                </p>
              </div>
              <nav className="hidden items-center gap-1">
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
                className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-xs font-semibold uppercase text-muted-foreground transition hover:border-primary/50"
              >
                {data?.profile?.avatar_url ? (
                  <img src={data.profile.avatar_url} alt="" className="size-full object-cover" />
                ) : (
                  (data?.profile?.name?.[0] ?? "F")
                )}
              </Link>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-5 py-6 md:px-8 md:py-8">
            {settingsOpen || subscription.isLoading || paidAccess ? (
              children
            ) : (
              <SubscriptionRequired subscription={subscription.data ?? null} />
            )}
          </main>
        </div>

        {paidAccess ? <button
          type="button"
          onClick={value.openAdd}
          className="fixed bottom-24 right-5 z-40 flex h-13 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-float transition hover:bg-primary/90 active:scale-[0.98] md:bottom-8 md:right-8"
        >
          <Plus className="size-5" />
          <span className="hidden sm:inline">Adicionar movimentação</span>
        </button> : null}

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-sidebar/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium text-muted-foreground transition",
                )}
                activeProps={{ className: "text-primary font-semibold" }}
              >
                <item.icon className="size-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {paidAccess && data?.account && (
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
