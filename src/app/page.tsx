import {
  ShieldCheck,
  Globe2,
  Clock,
  MessageCircle,
} from "lucide-react";
import { CvvBanner } from "@/components/site/cvv-banner";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";
import { Button } from "@/components/ui/button";

const DIFERENCIAIS = [
  {
    icon: Globe2,
    title: "Atende brasileiros no exterior",
    desc: "Filtre por profissionais que acolhem quem vive fora e entende a dor de estar longe.",
  },
  {
    icon: Clock,
    title: "Fuso horário compatível",
    desc: "Encontre horários que funcionam onde você mora, de Portugal ao Japão.",
  },
  {
    icon: ShieldCheck,
    title: "CRP verificado",
    desc: "Todo psicólogo passa por verificação do registro no Conselho antes de aparecer.",
  },
  {
    icon: MessageCircle,
    title: "Contato direto no WhatsApp",
    desc: "Sem intermediação: você fala direto com o profissional e marca do seu jeito.",
  },
];

export default function HomePage() {
  return (
    <>
      <CvvBanner />
      <SiteHeader />

      <main className="flex-1">
        <Hero />

        {/* Diferenciais */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-heading">
              Feito para quem fala português
            </h2>
            <p className="mt-3 text-foreground-muted">
              De brasileiros para brasileiros — inclusive para quem mora longe de
              casa.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DIFERENCIAIS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-background p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg">{title}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA psicólogos */}
        <section className="bg-brand-dark">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-14 text-center md:flex-row md:text-left">
            <div>
              <h2 className="text-2xl font-semibold text-white md:text-3xl">
                É psicólogo? Apareça para quem procura por você.
              </h2>
              <p className="mt-2 max-w-xl text-white/70">
                Comece grátis: monte seu perfil, verifique seu CRP e apareça na
                busca. Sem comissão sobre suas sessões.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Button
                href="/cadastro"
                size="lg"
                className="bg-brand text-white hover:bg-primary-hover"
              >
                Criar meu perfil
              </Button>
              <Button
                href="/para-psicologos"
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Ver planos
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
