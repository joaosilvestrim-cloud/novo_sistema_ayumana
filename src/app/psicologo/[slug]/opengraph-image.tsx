import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Perfil de psicólogo na Ayumana";

// Cores da marca
const PETROLEO = "#05474A";
const VERDE = "#73A533";

function initials(name: string | null) {
  if (!name) return "AY";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
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
    .select("display_name, avatar_url, crp_number, crp_uf, headline, attends_abroad, city")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  const p = data as
    | {
        display_name: string | null;
        avatar_url: string | null;
        crp_number: string | null;
        crp_uf: string | null;
        headline: string | null;
        attends_abroad: boolean;
        city: string | null;
      }
    | null;

  const name = p?.display_name ?? "Ayumana";
  const crp = p?.crp_number ? `CRP ${p.crp_number}${p.crp_uf ? `/${p.crp_uf}` : ""}` : "Psicólogo(a)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${PETROLEO} 0%, #073a3d 60%, #0a2d2f 100%)`,
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        {/* Topo: marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 20, height: 20, borderRadius: 999, background: VERDE }} />
          <div style={{ fontSize: 34, color: "#ffffff", fontWeight: 700, letterSpacing: -1 }}>
            ayumana
          </div>
        </div>

        {/* Meio: foto + dados */}
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          {p?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.avatar_url}
              width={280}
              height={280}
              style={{
                width: 280,
                height: 280,
                borderRadius: 999,
                objectFit: "cover",
                border: `8px solid ${VERDE}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 280,
                height: 280,
                borderRadius: 999,
                background: "#cfe6e7",
                color: PETROLEO,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 110,
                fontWeight: 700,
                border: `8px solid ${VERDE}`,
              }}
            >
              {initials(name)}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
            <div style={{ fontSize: 62, color: "#ffffff", fontWeight: 700, lineHeight: 1.05 }}>
              {name}
            </div>
            <div style={{ fontSize: 30, color: "#a6d4d6", marginTop: 10 }}>{crp}</div>
            {p?.headline && (
              <div style={{ fontSize: 28, color: "#e9f3f3", marginTop: 20, lineHeight: 1.3 }}>
                {p.headline.length > 110 ? p.headline.slice(0, 110) + "…" : p.headline}
              </div>
            )}
            {p?.attends_abroad && (
              <div
                style={{
                  marginTop: 26,
                  alignSelf: "flex-start",
                  background: VERDE,
                  color: "#ffffff",
                  fontSize: 26,
                  fontWeight: 600,
                  padding: "10px 22px",
                  borderRadius: 999,
                }}
              >
                🌎 Atende brasileiros no exterior
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ fontSize: 28, color: "#96a5a2" }}>
          Terapia em português, onde você estiver · ayumana.com.br
        </div>
      </div>
    ),
    { ...size }
  );
}
