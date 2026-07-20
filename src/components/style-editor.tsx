"use client";

import { useState } from "react";
import { STYLE_SPECTRUMS, styleValue, styleReading, type Style } from "@/lib/style";

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
    <div className="space-y-6">
      {STYLE_SPECTRUMS.map((s) => {
        const v = vals[s.key];
        return (
          <div key={s.key}>
            <div className="mb-1 flex justify-between gap-4 text-xs">
              <div>
                <p className="font-medium text-heading">{s.left}</p>
                <p className="text-foreground-muted">{s.leftDesc}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-heading">{s.right}</p>
                <p className="text-foreground-muted">{s.rightDesc}</p>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={v}
              onChange={(e) => set(s.key, Number(e.target.value))}
              className="w-full accent-[var(--ayu-verde)]"
            />
            <p className="mt-1 text-center text-xs font-medium text-brand-dark">{styleReading(s, v)}</p>
          </div>
        );
      })}
      <input type="hidden" name={name} value={JSON.stringify(vals)} />
    </div>
  );
}
