import Link from "next/link";
import { ShieldCheck, Globe2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/whatsapp";
import { AUDIENCE_LABELS, type Audience } from "@/lib/types";
import type { PsychologistCard as Card } from "@/lib/psychologists";

const PAID = new Set(["destaque", "ideal", "presenca"]);

function initials(name: string | null) {
  if (!name) return "AY";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function PsychologistCard({ p }: { p: Card }) {
  const price = PAID.has(p.plan_tier) ? formatPrice(p.session_price_cents) : null;
  const tags = p.specialties.slice(0, 3);
  const mainApproach = p.approaches[0]?.name;

  return (
    <Link
      href={`/psicologo/${p.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-100 text-lg font-semibold text-teal-800">
          {initials(p.display_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-heading group-hover:text-brand-dark">
              {p.display_name}
            </h3>
            <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" aria-label="CRP verificado" />
          </div>
          <p className="text-sm text-foreground-muted">
            {mainApproach ?? "Psicólogo(a)"}
            {p.crp_number ? ` · CRP ${p.crp_number}` : ""}
          </p>
          {(p.city || p.attends_abroad) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
              {p.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[p.city, p.state].filter(Boolean).join(" / ")}
                </span>
              )}
              {p.attends_abroad && (
                <span className="inline-flex items-center gap-1 text-teal-700">
                  <Globe2 className="h-3 w-3" />
                  Atende no exterior
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {p.headline && (
        <p className="mt-3 line-clamp-2 text-sm text-foreground">{p.headline}</p>
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Badge key={t.id} tone={t.category === "exterior" ? "brand" : "neutral"}>
              {t.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex flex-wrap gap-1.5 text-xs text-foreground-muted">
          {(p.audiences ?? []).slice(0, 3).map((a) => (
            <span key={a}>{AUDIENCE_LABELS[a as Audience]}</span>
          ))}
        </div>
        {price ? (
          <span className="text-sm font-medium text-heading">{price}</span>
        ) : (
          <span className="text-sm font-medium text-brand-dark group-hover:underline">
            Ver perfil →
          </span>
        )}
      </div>
    </Link>
  );
}
