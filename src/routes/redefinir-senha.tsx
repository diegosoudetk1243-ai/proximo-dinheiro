import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/redefinir-senha")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nova senha — Fluxo App" },
      { name: "description", content: "Defina uma nova senha para entrar no Fluxo App." },
      { property: "og:title", content: "Nova senha — Fluxo App" },
      { property: "og:description", content: "Defina uma nova senha de acesso." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada.");
    navigate({ to: "/inicio", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-5">
        <h1 className="text-2xl font-bold">Definir nova senha</h1>
        <div className="space-y-2">
          <Label htmlFor="nova-senha">Nova senha</Label>
          <Input
            id="nova-senha"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 rounded-2xl"
          />
        </div>
        <Button
          onClick={() => void save()}
          disabled={loading}
          className="h-12 w-full rounded-2xl"
        >
          Salvar senha
        </Button>
      </div>
    </main>
  );
}
