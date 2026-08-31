"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Analytics próprio, respeitando privacidade: sem IP, sem dado pessoal. Só um id
// anônimo aleatório por navegador, para contar visitantes. Não rastreia as áreas
// internas (admin/estudio).

function visitorId(): string {
  try {
    let v = localStorage.getItem("ayu_vid");
    if (!v) {
      v = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("ayu_vid", v);
    }
    return v;
  } catch {
    return "anon";
  }
}

function device(): "mobile" | "desktop" {
  return typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop";
}

function referrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const u = new URL(document.referrer);
    if (u.host === location.host) return null;
    return u.host;
  } catch {
    return null;
  }
}

function send(payload: Record<string, unknown>) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* nunca quebra a navegação */
  }
}

const interno = (p: string) => p.startsWith("/admin") || p.startsWith("/estudio");

/**
 * Atribuição de comunidade: ao entrar numa landing /comunidades/{slug}, guarda o
 * slug na sessão. A partir daí, todo evento (busca, perfil, clique no WhatsApp)
 * carrega essa origem, para medir o funil de cada parceiro até o contato.
 */
function communityAtual(path: string): string | null {
  try {
    const m = path.match(/^\/comunidades\/([^/?#]+)/);
    if (m && m[1]) {
      sessionStorage.setItem("ayu_community", m[1]);
      return m[1];
    }
    return sessionStorage.getItem("ayu_community");
  } catch {
    return null;
  }
}

export function SiteTracker() {
  const pathname = usePathname();
  const ultimo = useRef<string>("");

  // Pageview a cada troca de rota.
  useEffect(() => {
    if (!pathname || interno(pathname) || ultimo.current === pathname) return;
    ultimo.current = pathname;
    send({ type: "pageview", path: pathname, referrer: referrerHost(), device: device(), visitor: visitorId(), community: communityAtual(pathname) });
  }, [pathname]);

  // Cliques em links, botões e qualquer elemento com data-track.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const p = location.pathname;
      if (interno(p)) return;
      const alvo = (e.target as HTMLElement)?.closest?.("a,button,[data-track]") as HTMLElement | null;
      if (!alvo) return;
      let label = alvo.getAttribute("data-track");
      if (!label) {
        const a = alvo.closest("a") as HTMLAnchorElement | null;
        const href = a?.getAttribute("href");
        if (href) label = href;
      }
      if (!label) label = (alvo.textContent || "").trim().slice(0, 60);
      if (!label) return;
      send({ type: "click", path: p, label, device: device(), visitor: visitorId(), community: communityAtual(p) });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
