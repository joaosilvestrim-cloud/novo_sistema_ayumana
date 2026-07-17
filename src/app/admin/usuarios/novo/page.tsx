import { requireAdmin } from "@/lib/auth";
import { NewUserForm } from "../new-user-form";

export const metadata = { title: "Novo usuário" };

export default async function NovoUsuarioPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Novo usuário</h1>
        <p className="mt-1 text-foreground-muted">
          Crie um administrador ou psicólogo com acesso imediato.
        </p>
      </div>
      <NewUserForm />
    </div>
  );
}
