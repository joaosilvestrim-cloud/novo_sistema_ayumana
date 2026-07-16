import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-heading", className)}
      {...props}
    />
  );
}

const inputBase =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputBase, className)} {...props} />;
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(inputBase, "min-h-24 resize-y", className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select ref={ref} className={cn(inputBase, "pr-8", className)} {...props} />
  );
});

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && <p className="mt-1 text-xs text-foreground-muted">{hint}</p>}
    </div>
  );
}
