import { cn } from "@/lib/utils";

function initials(name: string | null) {
  if (!name) return "AY";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Foto do psicólogo com fallback para as iniciais. */
export function Avatar({
  src,
  name,
  size = 56,
  className,
}: {
  src?: string | null;
  name: string | null;
  size?: number;
  className?: string;
}) {
  const dim = { width: size, height: size };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "Psicólogo"}
        style={dim}
        loading="lazy"
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      style={dim}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-800",
        className
      )}
    >
      <span style={{ fontSize: size * 0.32 }}>{initials(name)}</span>
    </div>
  );
}
