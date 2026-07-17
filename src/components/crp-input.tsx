"use client";

import { useState } from "react";
import { Input } from "@/components/ui/field";

/** Padroniza o CRP no formato REGIÃO/NÚMERO (ex.: 06/153352). */
export function CrpInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const format = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 8); // 2 dígitos de região + até 6
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}/${d.slice(2)}`;
  };
  const [val, setVal] = useState(format(defaultValue ?? ""));

  return (
    <Input
      name={name}
      inputMode="numeric"
      value={val}
      onChange={(e) => setVal(format(e.target.value))}
      placeholder="06/153352"
      autoComplete="off"
    />
  );
}
