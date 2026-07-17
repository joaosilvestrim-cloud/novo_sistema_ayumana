"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("A senha precisa ter ao menos 8 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Link inválido ou expirado. Peça um novo link de redefinição.");
    } else {
      router.push("/painel");
    }
  }

  return (
    <div>
      <h1 className="text-2xl">Criar nova senha</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Defina uma senha para acessar seu painel.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Nova senha" htmlFor="password" hint="Mínimo de 8 caracteres.">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando..." : "Salvar senha"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-foreground-muted">
        <Link href="/esqueci-senha" className="font-medium text-brand-dark hover:underline">
          Pedir um novo link
        </Link>
      </p>
    </div>
  );
}
