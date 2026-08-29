"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null };

export async function signInAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/painel");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  // Redireciona pelo papel quando o destino é o padrão.
  let dest = next;
  if (next === "/painel" && data.user) {
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (prof?.role === "conteudo") dest = "/estudio";
    else if (prof?.role === "admin") dest = "/admin";
  }

  revalidatePath("/", "layout");
  redirect(dest);
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Preencha todos os campos." };
  }
  if (password.length < 8) {
    return { error: "A senha precisa ter ao menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("registered") || error.message.toLowerCase().includes("already")) {
      return { error: "Já existe uma conta com este e-mail. Faça login abaixo, ou use \"Esqueci minha senha\" se não lembra a senha." };
    }
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  // Com a confirmação de e-mail ligada, o Supabase NÃO retorna erro para um
  // e-mail que já existe (proteção contra enumeração): devolve um "sucesso" com
  // identities vazio. Sem tratar isso, cada nova tentativa reenviava e-mail e a
  // pessoa achava que o cadastro não completava. Aqui detectamos e orientamos.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { error: "Já existe uma conta com este e-mail. Faça login abaixo, ou use \"Esqueci minha senha\" se não lembra a senha." };
  }

  // Se a confirmação de e-mail estiver ativa, não há sessão ainda.
  if (!data.session) {
    redirect(`/login?confirme=1&email=${encodeURIComponent(email)}`);
  }

  revalidatePath("/", "layout");
  redirect("/painel/onboarding");
}

/**
 * Salva a nova senha. Roda no servidor, onde o client Supabase lê a sessão
 * de recuperação pelos cookies. Antes isso era feito no browser e falhava
 * quando o cookie de sessão não chegava ao JS.
 */
export async function updatePasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "A senha precisa ter ao menos 8 caracteres." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Link inválido ou expirado. Peça um novo link de redefinição." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Não foi possível salvar a senha. Peça um novo link e tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect("/painel");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
