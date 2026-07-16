import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { CvvBanner } from "@/components/site/cvv-banner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <CvvBanner />
      <div className="flex flex-1 items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Logo priority />
          </div>
          <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
            {children}
          </div>
          <p className="mt-6 text-center text-xs text-foreground-muted">
            <Link href="/" className="hover:text-brand-dark">
              ← Voltar para a Ayumana
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
