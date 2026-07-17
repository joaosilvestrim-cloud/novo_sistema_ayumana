import Link from "next/link";
import { ShieldCheck, MapPin, Heart, HeartHandshake, User, ArrowRight } from "lucide-react";
import { AvatarBubble, bubbleColor } from "@/components/ui/avatar-bubble";
import type { PsychologistCard as Card } from "@/lib/psychologists";

export function PsychologistCard({ p }: { p: Card }) {
  const mainApproach = p.approaches[0]?.name;
  const location = [p.city, p.state].filter(Boolean).join(" / ");
  const color = bubbleColor(p.id);

  return (
    <Link
      href={`/psicologo/${p.slug}`}
      className="group flex flex-col gap-5 rounded-3xl border border-border bg-background p-5 transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:gap-6 sm:p-6"
    >
      <AvatarBubble
        src={p.avatar_url}
        name={p.display_name}
        seed={p.id}
        color={color}
        size={200}
        className="mx-auto w-44 shrink-0 sm:mx-0 sm:w-52"
      />

      <div className="min-w-0 flex-1">
        {mainApproach && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-heading"
            style={{ backgroundColor: `${color}1F` }}
          >
            <HeartHandshake className="h-3.5 w-3.5" style={{ color }} />
            {mainApproach}
          </span>
        )}

        <h3 className="mt-2 flex items-center gap-2 font-serif text-2xl leading-tight text-heading group-hover:text-brand-dark sm:text-3xl">
          <span className="truncate">{p.display_name}</span>
          <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" aria-label="CRP verificado" />
        </h3>

        <div className="mt-2 space-y-1 text-sm text-foreground-muted">
          {p.crp_number && (
            <p className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" /> CRP {p.crp_number}
            </p>
          )}
          {location && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" /> {location}
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
}
