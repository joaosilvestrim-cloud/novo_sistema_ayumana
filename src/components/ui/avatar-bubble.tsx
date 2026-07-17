import { cn } from "@/lib/utils";

// Silhueta interna (área da foto) vetorizada da moldura orgânica real. viewBox 671x632.
const INNER_PATH =
  "M 554 70 L 605 102 L 631 126 L 643 142 L 654 163 L 664 197 L 666 214 L 665 238 L 656 274 L 633 323 L 605 371 L 562 430 L 532 464 L 505 491 L 457 532 L 402 570 L 345 601 L 311 615 L 288 622 L 259 627 L 229 627 L 200 621 L 194 612 L 194 603 L 197 598 L 202 594 L 214 591 L 229 584 L 246 570 L 260 551 L 265 540 L 270 522 L 271 504 L 268 488 L 256 462 L 246 449 L 230 433 L 200 411 L 127 372 L 95 352 L 76 337 L 59 320 L 38 291 L 24 264 L 13 235 L 6 206 L 3 178 L 4 155 L 9 130 L 15 113 L 26 92 L 39 74 L 57 56 L 87 35 L 114 22 L 138 14 L 164 8 L 197 4 L 240 3 L 291 5 L 342 9 L 400 17 L 441 26 L 484 39 L 517 52 Z";

const VIEW_W = 671;
const VIEW_H = 632;

// As 4 cores da marca (Pantone 3165C / 3501C / 3115C / 128C).
export const BUBBLE_COLORS = ["#05474A", "#73A533", "#53C4CC", "#F5C84B"];

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Cor da marca (estável) para um profissional, a partir de uma seed. */
export function bubbleColor(seed: string): string {
  return BUBBLE_COLORS[hash(seed) % BUBBLE_COLORS.length];
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

/** Foto do psicólogo recortada dentro da moldura orgânica da marca, com contorno colorido. */
export function AvatarBubble({
  src,
  name,
  size = 160,
  seed,
  color,
  strokeWidth = 8,
  className,
}: {
  src?: string | null;
  name: string | null;
  size?: number;
  seed?: string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  const stroke = color || bubbleColor(seed || name || "ayumana");
  const clipId = `bubble-${hash((seed || name || "ay") + "-" + size)}`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={size}
      role="img"
      aria-label={name ?? "Psicólogo"}
      className={cn("shrink-0", className)}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={INNER_PATH} />
        </clipPath>
      </defs>

      {src ? (
        <image
          href={src}
          x="0"
          y="0"
          width={VIEW_W}
          height={VIEW_H}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <>
          <path d={INNER_PATH} fill={stroke} fillOpacity="0.12" />
          <text
            x="330"
            y="300"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="210"
            fontWeight="600"
            fill={stroke}
          >
            {initials(name)}
          </text>
        </>
      )}

      <path
        d={INNER_PATH}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}
