"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { HeroPerson } from "@/lib/psychologists";

// Posições/animações fixas dos 3 cartões + fallback fictício se não houver reais.
const SLOTS = [
  { initials: "MA", name: "Mariana A.", role: "TCC · atende no exterior", place: "🇵🇹 Portugal", tone: "bg-teal-100 text-teal-800", cls: "ayu-float", style: { top: "4%", right: "6%" }, delay: "0s" },
  { initials: "RS", name: "Rafael S.", role: "Psicanálise", place: "🇺🇸 EUA", tone: "bg-green-100 text-green-800", cls: "ayu-float-slow", style: { top: "40%", right: "40%" }, delay: "1.2s" },
  { initials: "CN", name: "Camila N.", role: "Infância · bilíngues", place: "🇮🇪 Irlanda", tone: "bg-yellow-400/20 text-yellow-600", cls: "ayu-float", style: { bottom: "6%", right: "10%" }, delay: "0.6s" },
];

const COUNTRY_PILLS = [
  { flag: "🇩🇪", label: "Alemanha", style: { top: "24%", right: "34%" }, cls: "ayu-float-slow", delay: "0.3s" },
  { flag: "🇯🇵", label: "Japão", style: { bottom: "28%", right: "48%" }, cls: "ayu-float", delay: "1.6s" },
];

function firstNames(name: string | null): string {
  if (!name) return "Psicólogo(a)";
  const parts = name.trim().split(/\s+/).filter((w) => !/^(dr|dra|prof|profa)\.?$/i.test(w));
  return parts[1] ? `${parts[0]} ${parts[1][0]}.` : parts[0] || "Psicólogo(a)";
}

export function HeroVisual({ people = [] }: { people?: HeroPerson[] }) {
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(true);
  const canRotate = people.length > 3;

  // Rotaciona os 3 cartões pela lista inteira (todos os IDEAL passam pela animação).
  useEffect(() => {
    if (!canRotate) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTick((t) => t + 1);
        setVisible(true);
      }, 450);
    }, 5000);
    return () => clearInterval(id);
  }, [canRotate]);

  return (
    <div className="relative hidden h-[440px] lg:block" aria-hidden>
      <div className="absolute right-[14%] top-1/2 h-72 w-72 -translate-y-1/2 rounded-[46%_54%_60%_40%/48%_42%_58%_52%] border-2 border-brand/30" />
      <div className="absolute right-[10%] top-1/2 h-80 w-80 -translate-y-1/2 rounded-[54%_46%_40%_60%/58%_52%_48%_42%] border border-accent/30" />

      {COUNTRY_PILLS.map((c) => (
        <div
          key={c.label}
          className={`absolute ${c.cls} rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-heading shadow-sm backdrop-blur`}
          style={{ ...c.style, animationDelay: c.delay }}
        >
          <span className="mr-1">{c.flag}</span>
          {c.label}
        </div>
      ))}

      {SLOTS.map((fake, i) => {
        const real = people.length ? people[(tick * 3 + i) % people.length] : undefined;
        const name = real ? firstNames(real.name) : fake.name;
        const role = real ? real.role : fake.role;
        const place = real ? real.place : fake.place;
        const cardCls = `absolute ${fake.cls} w-56 rounded-2xl border border-border bg-background/95 p-3.5 shadow-lg shadow-teal-900/5 backdrop-blur transition-opacity duration-500`;
        const inner = (
          <>
            <div className="flex items-center gap-3">
              {real?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={real.avatar_url} alt={name ?? "Psicólogo"} className="h-11 w-11 shrink-0 rounded-full object-cover" />
              ) : (
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${fake.tone}`}>
                  {fake.initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm font-semibold text-heading">{name}</p>
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-green-600" />
                </div>
                <p className="truncate text-xs text-foreground-muted">{role}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
              <span className="truncate text-xs text-foreground-muted">{place}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-green-700">
                <span className="ayu-pulse-dot h-1.5 w-1.5 rounded-full bg-green-500" />
                online
              </span>
            </div>
          </>
        );
        const style = { ...fake.style, animationDelay: fake.delay, opacity: visible ? 1 : 0 };
        return real?.slug ? (
          <Link key={i} href={`/psicologo/${real.slug}`} className={cardCls} style={style}>
            {inner}
          </Link>
        ) : (
          <div key={i} className={cardCls} style={style}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
