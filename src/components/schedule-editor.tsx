"use client";

import { useState } from "react";
import { DAY_ORDER, DAY_LABEL, type DayKey, type Schedule } from "@/lib/schedule";

type Row = { open: string; close: string; on: boolean };

function initRows(initial?: Schedule | null): Record<DayKey, Row> {
  const out = {} as Record<DayKey, Row>;
  for (const d of DAY_ORDER) {
    const v = initial?.[d] ?? null;
    out[d] = v ? { open: v.open, close: v.close, on: true } : { open: "08:00", close: "18:00", on: false };
  }
  return out;
}

/** Editor semanal de horário. Grava JSON num input escondido `name`. */
export function ScheduleEditor({
  name,
  initial,
}: {
  name: string;
  initial?: Schedule | null;
}) {
  const [rows, setRows] = useState<Record<DayKey, Row>>(() => initRows(initial));

  const set = (d: DayKey, patch: Partial<Row>) =>
    setRows((r) => ({ ...r, [d]: { ...r[d], ...patch } }));

  const json = JSON.stringify(
    Object.fromEntries(
      DAY_ORDER.map((d) => [d, rows[d].on ? { open: rows[d].open, close: rows[d].close } : null])
    )
  );

  return (
    <div className="space-y-2 rounded-lg border border-border bg-background p-3">
      {DAY_ORDER.map((d) => (
        <div key={d} className="flex items-center gap-3">
          <label className="flex w-40 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={rows[d].on}
              onChange={(e) => set(d, { on: e.target.checked })}
              className="h-4 w-4 accent-[var(--ayu-verde)]"
            />
            {DAY_LABEL[d]}
          </label>
          {rows[d].on ? (
            <div className="flex items-center gap-2 text-sm">
              <input
                type="time"
                value={rows[d].open}
                onChange={(e) => set(d, { open: e.target.value })}
                className="rounded-md border border-border px-2 py-1"
              />
              <span className="text-foreground-muted">às</span>
              <input
                type="time"
                value={rows[d].close}
                onChange={(e) => set(d, { close: e.target.value })}
                className="rounded-md border border-border px-2 py-1"
              />
            </div>
          ) : (
            <span className="text-sm text-foreground-muted">Fechado</span>
          )}
        </div>
      ))}
      <input type="hidden" name={name} value={json} />
    </div>
  );
}
