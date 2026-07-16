"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  size = "md",
  variant = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size={size}
      variant={variant}
      disabled={pending}
      className={cn(className)}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
