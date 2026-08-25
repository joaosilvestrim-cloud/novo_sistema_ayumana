import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Perfil de psicólogo na Ayumana";

const ACENTOS = "áàâãäéèêëíìîïóòôõöúùûüçñºªÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ";

function initials(name: string | null) {
  if (!name) return "AY";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "AY";
}

/** Baixa só os glifos usados de uma fonte do Google (com acentos). Se falhar, usa a padrão. */
async function loadFont(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const api = `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await fetch(api, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
    const url = css.match(/src:\s*url\((https:[^)]+)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("psychologists")
    .select("display_name, avatar_url, crp_number, crp_uf, approaches:psychologist_approaches(approach:approaches(name))")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  const p = data as {
    display_name: string | null;
    avatar_url: string | null;
    crp_number: string | null;
    crp_uf: string | null;
    approaches: { approach: { name: string } | null }[] | null;
  } | null;

  const nome = p?.display_name ?? "Ayumana";
  const abordagem = p?.approaches?.[0]?.approach?.name ?? "Psicólogo(a)";
  const crp = p?.crp_number ? `CRP ${p.crp_number}${p.crp_uf ? `/${p.crp_uf}` : ""}` : "";
  const foto = p?.avatar_url ?? null;

  const subset = `${nome} ${abordagem} ${crp} Ayumana CRP verificado Terapia em português, onde você estiver ayumana.com.br ${initials(nome)} ${ACENTOS}`;
  const [reg, bold] = await Promise.all([loadFont(400, subset), loadFont(700, subset)]);
  const fonts = [
    reg ? { name: "Inter", data: reg, weight: 400 as const, style: "normal" as const } : null,
    bold ? { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const } : null,
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #04393B 0%, #0A5F57 100%)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 40, height: 40, borderRadius: 14, background: "#73A533" }} />
          <span style={{ fontSize: 34, fontWeight: 700, color: "#ffffff" }}>Ayumana</span>
        </div>

        {/* Foto + identidade */}
        <div style={{ display: "flex", alignItems: "center", gap: 52 }}>
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foto}
              width={300}
              height={300}
              style={{ borderRadius: 300, objectFit: "cover", border: "10px solid #ffffff" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 300,
                height: 300,
                borderRadius: 300,
                background: "rgba(255,255,255,0.12)",
                color: "#ffffff",
                fontSize: 120,
                fontWeight: 700,
                border: "10px solid rgba(255,255,255,0.85)",
              }}
            >
              {initials(nome)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
            <span style={{ fontSize: 60, fontWeight: 700, color: "#ffffff", lineHeight: 1.1 }}>{nome}</span>
            <span style={{ fontSize: 32, color: "#B8D4D1", marginTop: 14 }}>
              {abordagem}
              {crp ? ` · ${crp}` : ""}
            </span>
            <div style={{ display: "flex", marginTop: 26 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#E3F4EA",
                  color: "#1F7A4D",
                  padding: "12px 24px",
                  borderRadius: 999,
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1F7A4D" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                CRP verificado
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 28, color: "#9FC2BF" }}>Terapia em português, onde você estiver</span>
          <span style={{ fontSize: 28, color: "#ffffff", fontWeight: 700 }}>ayumana.com.br</span>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) }
  );
}
