import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { getProfile } from "@/lib/auth";
import { signOutAction } from "@/app/(auth)/actions";

export const metadata = { title: "Portal do parceiro · Ayumana" };

export default async function ParceiroLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/parceiro" className="flex items-center gap-2">
            <Logo variant="full" />
            <span className="hidden text-sm text-foreground-muted sm:inline">· Parceiros</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-foreground-muted sm:inline">{profile?.full_name}</span>
            <form action={signOutAction}>
              <button className="inline-flex items-center gap-1.5 text-foreground-muted hover:text-heading">
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
