const DEFAULT_MESSAGE =
  "Olá! Encontrei seu perfil na Ayumana e gostaria de saber mais sobre seus atendimentos.";

/** Monta o link wa.me com mensagem pré-preenchida. Retorna null se não houver número. */
export function whatsappLink(
  phone: string | null | undefined,
  message?: string | null
): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const text = encodeURIComponent(message?.trim() || DEFAULT_MESSAGE);
  return `https://wa.me/${digits}?text=${text}`;
}

/** Normaliza o Instagram para só o handle (sem @, sem URL). Retorna null se inválido. */
export function instagramHandle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let h = String(raw).trim();
  const m = h.match(/instagram\.com\/([^/?#\s]+)/i);
  if (m) h = m[1];
  h = h.replace(/^@+/, "").trim();
  if (!h || /\s/.test(h)) return null;
  return h;
}

/** Formata centavos como BRL. */
export function formatPrice(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
