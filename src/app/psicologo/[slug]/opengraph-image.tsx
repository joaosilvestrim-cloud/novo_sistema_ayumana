import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Perfil de psicólogo na Ayumana";

const PETROLEO = "#04393B";
const VERDE = "#73A533";

function initials(name: string | null) {
  if (!name) return "AY";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "AY";
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
  const nome = p?.display_name ?? "Ayumana";
  const foto = p?.avatar_url ?? null;

  // Selo discreto da marca, no canto.
  const selo = (
    <div
      style={{
        position: "absolute",
        left: 32,
        bottom: 30,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(4,57,59,0.72)",
        padding: "10px 20px",
        borderRadius: 999,
      }}
    >
      <div style={{ width: 14, height: 14, borderRadius: 999, background: VERDE }} />
      <span style={{ fontSize: 26, color: "#ffffff", fontWeight: 700, letterSpacing: -0.3 }}>ayumana</span>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", background: PETROLEO }}>
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            width={1200}
            height={630}
            style={{ width: 1200, height: 630, objectFit: "cover", objectPosition: "center 28%" }}
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
            {initials(nome)}
          </div>
        )}
        {selo}
      </div>
    ),
    { ...size }
  );
}
