import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** "full" mostra o wordmark; "symbol" só o balão/símbolo. */
  variant?: "full" | "symbol";
  href?: string | null;
  className?: string;
  priority?: boolean;
};

const SIZES = {
  full: { w: 168, h: 48, src: "/brand/ayumana-logo.png", alt: "Ayumana" },
  symbol: { w: 40, h: 40, src: "/brand/ayumana-symbol.png", alt: "Ayumana" },
} as const;

export function Logo({
  variant = "full",
  href = "/",
  className,
  priority,
}: LogoProps) {
  const { w, h, src, alt } = SIZES[variant];
  const img = (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      priority={priority}
      className={cn("h-9 w-auto object-contain", className)}
    />
  );

  if (href) {
    return (
      <Link href={href} aria-label="Ayumana — início" className="inline-flex">
        {img}
      </Link>
    );
  }
  return img;
}
