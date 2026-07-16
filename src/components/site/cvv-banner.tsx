import { Phone } from "lucide-react";

/** Aviso de crise obrigatório em todo o site (Blueprint §9). */
export function CvvBanner() {
  return (
    <div className="w-full bg-brand-dark text-white/90">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-center text-xs">
        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Em crise ou sofrimento emocional? Ligue para o{" "}
          <a
            href="tel:188"
            className="font-semibold underline underline-offset-2 hover:text-white"
          >
            CVV 188
          </a>{" "}
          — apoio emocional gratuito, 24h.
        </span>
      </div>
    </div>
  );
}
