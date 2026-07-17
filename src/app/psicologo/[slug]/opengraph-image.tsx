import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Perfil de psicólogo na Ayumana";

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
    .select("display_name, avatar_url, crp_number, crp_uf, headline, attends_abroad")
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
      }
    | null;

  const name = p?.display_name ?? "Ayumana";
  const crp = p?.crp_number ? `CRP ${p.crp_number}${p.crp_uf ? `/${p.crp_uf}` : ""}` : "Psicólogo(a)";
  const PHOTO_W = 470;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", fontFamily: "sans-serif", background: PETROLEO }}>
        {/* Foto — lateral esquerda, altura total */}
        <div style={{ width: PHOTO_W, height: "100%", display: "flex" }}>
          {p?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.avatar_url}
              width={PHOTO_W}
              height={630}
              style={{ width: PHOTO_W, height: 630, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: PHOTO_W,
                height: 630,
                background: "#0a5155",
                color: "#cfe6e7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 180,
                fontWeight: 700,
              }}
            >
              {initials(name)}
            </div>
          )}
        </div>

        {/* Painel de dados */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 60,
            background: `linear-gradient(135deg, ${PETROLEO} 0%, #073a3d 100%)`,
          }}
        >
          {/* marca */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 18, height: 18, borderRadius: 999, background: VERDE }} />
            <div style={{ fontSize: 32, color: "#ffffff", fontWeight: 700, letterSpacing: -1 }}>
              ayumana
            </div>
          </div>

          {/* dados */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, color: "#ffffff", fontWeight: 700, lineHeight: 1.05 }}>
              {name}
            </div>
            <div style={{ fontSize: 28, color: "#a6d4d6", marginTop: 12 }}>{crp}</div>
            {p?.headline && (
              <div style={{ fontSize: 26, color: "#e9f3f3", marginTop: 20, lineHeight: 1.3 }}>
                {p.headline.length > 120 ? p.headline.slice(0, 120) + "…" : p.headline}
              </div>
            )}
            {p?.attends_abroad && (
              <div
                style={{
                  marginTop: 24,
                  alignSelf: "flex-start",
                  background: VERDE,
                  color: "#ffffff",
                  fontSize: 24,
                  fontWeight: 600,
                  padding: "8px 20px",
                  borderRadius: 999,
                }}
              >
                🌎 Atende brasileiros no exterior
              </div>
            )}
          </div>

          {/* rodapé */}
          <div style={{ fontSize: 26, color: "#96a5a2" }}>
            Terapia em português · ayumana.com.br
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
