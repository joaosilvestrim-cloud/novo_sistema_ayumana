import Link from "next/link";
import { ShieldCheck, MapPin, Heart, HeartHandshake, User, ArrowRight } from "lucide-react";
import { AvatarBubble, bubbleColor } from "@/components/ui/avatar-bubble";
import { effectivePlan } from "@/lib/plan-features";
import type { PsychologistCard as Card } from "@/lib/psychologists";

export function PsychologistCard({
  p,
  stacked = false,
}: {
  p: Card;
  stacked?: boolean;
}) {
  const mainApproach = p.approaches[0]?.name;
  const location = [p.city, p.state].filter(Boolean).join(" / ");
  const color = bubbleColor(p.id);
  // Pagantes ganham o anel que respira, sinal discreto de destaque.
  const premium = effectivePlan(p) !== "essencial";

  const card = (
    <Link
      href={`/psicologo/${p.slug}`}
      className={`group relative flex gap-4 rounded-3xl border border-border bg-background p-5 transition-shadow hover:shadow-lg ${
        stacked ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:gap-6 sm:p-6"
      }`}
    >
      <AvatarBubble
        src={p.avatar_url}
        name={p.display_name}
        seed={p.id}
        color={color}
        size={190}
        className={stacked ? "mx-auto w-32" : "mx-auto w-36 shrink-0 sm:mx-0 sm:w-40"}
      />

      <div className="min-w-0 flex-1">
        {mainApproach && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-heading"
            style={{ backgroundColor: `${color}1F` }}
          >
            <HeartHandshake className="h-3.5 w-3.5 shrink-0" style={{ color }} />
            {mainApproach}
          </span>
        )}

        <h3
          className={`mt-2 flex items-start gap-1.5 font-serif leading-tight text-heading group-hover:text-brand-dark ${
            stacked ? "text-lg" : "text-xl sm:text-2xl"
          }`}
        >
          <span className="min-w-0 break-words">{p.display_name}</span>
          <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-green-600" aria-label="CRP verificado" />
          {premium && (
            <span className="mt-1 shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-dark">
              Destaque
            </span>
          )}
        </h3>

        <div className="mt-2 space-y-1 text-sm text-foreground-muted">
          {p.crp_number && (
            <p className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" /> CRP {p.crp_number}
            </p>
          )}
          {location && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" /> <span className="truncate">{location}</span>
            </p>
          )}
        </div>

        {p.headline && (
          <div className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-sm text-foreground">
            <Heart className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
            <span className="line-clamp-2">{p.headline}</span>
          </div>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <span
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors group-hover:brightness-95"
            style={{ borderColor: color, color }}
          >
            Ver perfil
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );

  if (!premium) return card;

  // Anel que respira ao redor do card, sinalizando destaque sem palavra nenhuma.
  return (
    <div className="relative h-full">
      <span
        aria-hidden
        className="psi-ring pointer-events-none absolute -inset-[3px] rounded-[1.65rem]"
      />
      {card}
    </div>
  );
}
