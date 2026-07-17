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
    .select("display_name, avatar_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  const p = data as { display_name: string | null; avatar_url: string | null } | null;
  const name = p?.display_name ?? "Ayumana";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          background: PETROLEO,
          fontFamily: "sans-serif",
        }}
      >
        {p?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.avatar_url}
            width={1200}
            height={630}
            style={{
              width: 1200,
              height: 630,
              objectFit: "cover",
              objectPosition: "center 25%",
            }}
          />
        ) : (
          <div
            style={{
              width: 1200,
              height: 630,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#cfe6e7",
              fontSize: 260,
              fontWeight: 700,
            }}
          >
            {initials(name)}
          </div>
        )}

        {/* Selo da marca (canto inferior direito) */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            right: 30,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(5,71,74,0.88)",
            padding: "12px 20px",
            borderRadius: 999,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: 999, background: VERDE }} />
          <div style={{ fontSize: 28, color: "#ffffff", fontWeight: 700, letterSpacing: -0.5 }}>
            ayumana
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
