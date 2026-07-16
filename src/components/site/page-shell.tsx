import { CvvBanner } from "@/components/site/cvv-banner";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CvvBanner />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-brand-dark">
          Em breve
        </span>
        <h1 className="mt-6 text-3xl">{title}</h1>
        <p className="mt-3 text-foreground-muted">{description}</p>
      </div>
    </PageShell>
  );
}
