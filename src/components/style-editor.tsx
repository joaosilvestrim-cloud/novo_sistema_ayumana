"use client";

import { useState } from "react";
import { STYLE_SPECTRUMS, styleValue, type Style } from "@/lib/style";

/** Editor dos espectros de estilo. Grava JSON num input escondido `name`. */
export function StyleEditor({
  name,
  initial,
}: {
  name: string;
  initial?: Style | null;
}) {
  const [vals, setVals] = useState<Style>(() =>
    Object.fromEntries(STYLE_SPECTRUMS.map((s) => [s.key, styleValue(initial, s.key)]))
  );

  const set = (key: string, v: number) => setVals((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="space-y-5">
      {STYLE_SPECTRUMS.map((s) => (
        <div key={s.key}>
          <div className="mb-1 flex justify-between text-xs font-medium text-foreground-muted">
            <span>{s.left}</span>
            <span>{s.right}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={vals[s.key]}
            onChange={(e) => set(s.key, Number(e.target.value))}
            className="w-full accent-[var(--ayu-verde)]"
          />
        </div>
      ))}
      <input type="hidden" name={name} value={JSON.stringify(vals)} />
    </div>
  );
}
