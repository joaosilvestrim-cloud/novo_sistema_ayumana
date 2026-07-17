"use client";

import { useState } from "react";

const DDI = [
  { c: "55", label: "🇧🇷 +55" },
  { c: "351", label: "🇵🇹 +351" },
  { c: "1", label: "🇺🇸 +1" },
  { c: "44", label: "🇬🇧 +44" },
  { c: "353", label: "🇮🇪 +353" },
  { c: "49", label: "🇩🇪 +49" },
  { c: "34", label: "🇪🇸 +34" },
  { c: "31", label: "🇳🇱 +31" },
  { c: "61", label: "🇦🇺 +61" },
  { c: "81", label: "🇯🇵 +81" },
];

function brMask(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Telefone padronizado: DDI + número, gravando E.164 (só dígitos) no hidden `name`. */
export function PhoneInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const parse = (raw: string) => {
    const digits = (raw || "").replace(/\D/g, "");
    for (const d of [...DDI].sort((a, b) => b.c.length - a.c.length)) {
      if (digits.startsWith(d.c)) return { ddi: d.c, nat: digits.slice(d.c.length) };
    }
    return { ddi: "55", nat: digits };
  };
  const init = parse(defaultValue ?? "");
  const [ddi, setDdi] = useState(init.ddi);
  const [nat, setNat] = useState(init.nat);

  const max = ddi === "55" ? 11 : 15;
  const display = ddi === "55" ? brMask(nat) : nat;
  const e164 = nat ? ddi + nat : "";

  return (
    <div className="flex gap-2">
      <select
        value={ddi}
        onChange={(e) => setDdi(e.target.value)}
        className="rounded-lg border border-border bg-background px-2 py-2.5 text-sm outline-none"
      >
        {DDI.map((d) => (
          <option key={d.c} value={d.c}>{d.label}</option>
        ))}
      </select>
      <input
        inputMode="tel"
        value={display}
        onChange={(e) => setNat(e.target.value.replace(/\D/g, "").slice(0, max))}
        placeholder={ddi === "55" ? "(11) 99999-9999" : "número"}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
      <input type="hidden" name={name} value={e164} />
    </div>
  );
}
