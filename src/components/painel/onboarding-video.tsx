"use client";

import { useEffect, useState } from "react";
import { PlayCircle, X } from "lucide-react";

export const ONBOARDING_VIDEO_URL =
  "https://nhxnhlnmjekcqldmxkar.supabase.co/storage/v1/object/public/onboarding/guia-psicologo.mp4";

/**
 * Card de boas-vindas com o vídeo de onboarding. Dispensável (guarda no
 * navegador que a pessoa já fechou). O vídeo continua sempre disponível na
 * tela de Ajuda pela versão fixa <OnboardingVideo />.
 */
export function OnboardingVideoCard() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem("ayu_onb_video_dismissed") === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    try { localStorage.setItem("ayu_onb_video_dismissed", "1"); } catch { /* ok */ }
    setHidden(true);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-brand/5 p-5">
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-md p-1 text-foreground-muted hover:bg-surface-muted"
        aria-label="Fechar"
        title="Fechar (você reencontra o vídeo em Ajuda)"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="mb-3 flex items-center gap-2">
        <PlayCircle className="h-5 w-5 text-brand-dark" />
        <div>
          <p className="font-medium text-heading">Comece por aqui</p>
          <p className="text-sm text-foreground-muted">
            Um guia rápido de como a Ayumana funciona e como deixar seu perfil pronto.
          </p>
        </div>
      </div>
      <video
        controls
        preload="metadata"
        className="w-full rounded-xl border border-border bg-black"
        src={ONBOARDING_VIDEO_URL}
      >
        Seu navegador não consegue exibir o vídeo.
      </video>
      <p className="mt-2 text-xs text-foreground-muted">
        Pode fechar quando quiser. O vídeo fica sempre guardado em “Ajuda e planos”.
      </p>
    </div>
  );
}

/** Versão fixa (não dispensável) para a tela de Ajuda. */
export function OnboardingVideo() {
  return (
    <video
      controls
      preload="metadata"
      className="w-full rounded-xl border border-border bg-black"
      src={ONBOARDING_VIDEO_URL}
    >
      Seu navegador não consegue exibir o vídeo.
    </video>
  );
}
