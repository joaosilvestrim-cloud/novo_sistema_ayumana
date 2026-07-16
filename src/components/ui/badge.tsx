import { cn } from "@/lib/utils";

type Tone = "neutral" | "warning" | "success" | "danger" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-foreground-muted",
  warning: "bg-yellow-400/20 text-yellow-600",
  success: "bg-brand/15 text-green-700",
  danger: "bg-danger/10 text-danger",
  brand: "bg-teal-100 text-teal-800",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
