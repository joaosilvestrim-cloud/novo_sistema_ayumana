import { cn } from "@/lib/utils";

// Silhueta do balão Ayumana (corpo arredondado + rabinho embaixo à esquerda).
const BUBBLE_PATH =
  "M52 6 A40 40 0 1 1 33.2 81.3 Q26 90 13 96 Q17 80 16.7 64.8 A40 40 0 0 1 52 6 Z";

// As 4 cores da marca (Pantone 3165C / 3501C / 3115C / 128C).
const COLORS = ["#05474A", "#73A533", "#53C4CC", "#F5C84B"];

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickColor(seed: string): number {
  return hash(seed) % COLORS.length;
}

function initials(name: string | null): string {
  if (!name) return "AY";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Foto do psicólogo recortada dentro do balão da marca, com contorno colorido. */
export function AvatarBubble({
  src,
  name,
  size = 56,
  seed,
  className,
}: {
  src?: string | null;
  name: string | null;
  size?: number;
  seed?: string;
  className?: string;
}) {
  const idx = pickColor(seed || name || "ayumana");
  const color = COLORS[idx];
  const clipId = `bubble-${hash((seed || name || "ay") + "-" + size)}`;

  return (
    <svg
      viewBox="-3 -3 106 106"
      width={size}
      height={size}
      role="img"
      aria-label={name ?? "Psicólogo"}
      className={cn("shrink-0", className)}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BUBBLE_PATH} />
        </clipPath>
      </defs>

      {src ? (
        <image
          href={src}
          x="-3"
          y="-3"
          width="106"
          height="106"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <>
          <path d={BUBBLE_PATH} fill={color} fillOpacity="0.12" />
          <text
            x="50"
            y="44"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="30"
            fontWeight="600"
            fill={color}
          >
            {initials(name)}
          </text>
        </>
      )}

      <path
        d={BUBBLE_PATH}
        fill="none"
        stroke={color}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
