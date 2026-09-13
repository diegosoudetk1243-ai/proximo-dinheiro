import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/Brand";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fluxo App — Controle seu fluxo de caixa" },
      {
        name: "description",
        content:
          "Saiba quanto você tem hoje e quanto terá amanhã. O Fluxo App calcula seu caixa previsto automaticamente.",
      },
      { property: "og:title", content: "Fluxo App — Controle seu fluxo de caixa" },
      {
        property: "og:description",
        content: "Registre o que entra e o que sai. O Fluxo App mostra seu caixa futuro.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "choice" | "email" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("choice");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) navigate({ to: "/inicio", replace: true });
      else setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/inicio", replace: true });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function signInWithGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/inicio", replace: true });
  }

  async function submitEmail() {
    if (!email.trim() || password.length < 6) {
      toast.error("Informe um e-mail válido e uma senha de pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Enviamos um e-mail para você confirmar a conta.");
          return;
        }
        navigate({ to: "/inicio", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        navigate({ to: "/inicio", replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  }

  async function sendReset() {
    if (!email.trim()) {
      toast.error("Informe seu e-mail.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Enviamos um link para redefinir sua senha.");
  }

  if (checking) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <section className="relative hidden overflow-hidden border-r border-border bg-sidebar p-12 lg:flex lg:flex-col lg:justify-between">
        <Brand />
        <div className="max-w-xl">
          <p className="eyebrow text-primary">Controle e previsão financeira</p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight">Seu dinheiro no controle.<br />Hoje e no futuro.</h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">Registre o que entra e sai. O Fluxo App organiza e mostra com clareza o caminho do seu caixa.</p>
        </div>
        <p className="text-xs text-muted-foreground">Confiança. Controle. Clareza.</p>
      </section>

      <section className="flex min-h-screen items-center px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-md space-y-8">
        <header className="space-y-6">
          <Brand className="lg:hidden" />
          <div>
            <p className="eyebrow text-primary">Acesse seu caixa</p>
            <h2 className="mt-3 text-3xl font-semibold">Seu dinheiro no controle.</h2>
            <p className="mt-2 text-muted-foreground">Hoje e no futuro.</p>
          </div>
        </header>

        {mode === "choice" && (
          <div className="space-y-4">
            <Button
              onClick={() => void signInWithGoogle()}
              disabled={loading}
              className="h-13 w-full rounded-xl text-base"
            >
              Continuar com Google
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              variant="outline"
              onClick={() => setMode("email")}
              className="h-13 w-full rounded-xl text-base"
            >
              <Mail className="size-4" /> Continuar com e-mail
            </Button>
          </div>
        )}

        {mode !== "choice" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setMode("choice")}
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <ArrowLeft className="size-4" /> Voltar
            </button>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl"
              />
            </div>

            {mode === "email" && (
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
            )}

            <Button
              onClick={() => (mode === "email" ? void submitEmail() : void sendReset())}
              disabled={loading}
              className="h-13 w-full rounded-xl py-6 text-base"
            >
              {mode === "forgot" ? "Enviar link" : isSignUp ? "Criar conta" : "Entrar"}
            </Button>

            {mode === "email" && (
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-primary"
                  onClick={() => setIsSignUp((value) => !value)}
                >
                  {isSignUp ? "Já tenho conta" : "Criar conta"}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground"
                  onClick={() => setMode("forgot")}
                >
                  Esqueci a senha
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </section>
    </main>
  );
}
