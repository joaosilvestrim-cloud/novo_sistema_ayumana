"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Users,
  X,
} from "lucide-react";

export type SubscriptionHealthPerson = {
  id: string;
  profileId: string;
  name: string;
  detail: string;
  meta?: string;
};

export type SubscriptionHealthGroup = {
  key: "active" | "waiting" | "overdue" | "cancelled";
  label: string;
  description: string;
  people: SubscriptionHealthPerson[];
};

const STYLE = {
  active: {
    icon: CheckCircle2,
    chip: "bg-green-100 text-green-800",
    selected: "border-green-500 ring-2 ring-green-500/20",
  },
  waiting: {
    icon: Clock,
    chip: "bg-yellow-100 text-yellow-800",
    selected: "border-yellow-500 ring-2 ring-yellow-500/20",
  },
  overdue: {
    icon: AlertCircle,
    chip: "bg-yellow-100 text-yellow-800",
    selected: "border-yellow-500 ring-2 ring-yellow-500/20",
  },
  cancelled: {
    icon: Users,
    chip: "bg-surface-muted text-foreground-muted",
    selected: "border-brand ring-2 ring-brand/20",
  },
} as const;

export function SubscriptionHealthDrilldown({
  groups,
}: {
  groups: SubscriptionHealthGroup[];
}) {
  const [selectedKey, setSelectedKey] = useState<SubscriptionHealthGroup["key"] | null>(null);
  const selected = groups.find((group) => group.key === selectedKey) ?? null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {groups.map((group) => {
          const style = STYLE[group.key];
          const Icon = style.icon;
          const open = selectedKey === group.key;
          return (
            <button
              key={group.key}
              type="button"
              aria-expanded={open}
              aria-controls="subscription-health-people"
              onClick={() => setSelectedKey(open ? null : group.key)}
              className={`group rounded-2xl border bg-background p-5 text-left transition hover:border-brand/50 hover:shadow-sm ${
                open ? style.selected : "border-border"
              }`}
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${style.chip}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-3 block text-2xl font-semibold text-heading">{group.people.length}</span>
              <span className="block text-sm text-foreground-muted">{group.label}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-dark">
                {open ? "Ocultar pessoas" : "Ver pessoas"}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <section
          id="subscription-health-people"
          className="mt-4 overflow-hidden rounded-2xl border border-brand/30 bg-background shadow-sm"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h3 className="text-lg text-heading">
                {selected.label} ({selected.people.length})
              </h3>
              <p className="mt-0.5 text-sm text-foreground-muted">{selected.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedKey(null)}
              aria-label="Fechar lista"
              className="rounded-lg p-2 text-foreground-muted hover:bg-surface-muted hover:text-heading"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selected.people.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-foreground-muted">
              Nenhuma pessoa neste status.
            </p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
              {selected.people.map((person) => (
                <li key={person.id} className="px-5 py-3 hover:bg-surface-muted/50">
                  <Link
                    href={`/admin/usuarios/${person.profileId}`}
                    className="font-medium text-heading hover:text-brand-dark hover:underline"
                  >
                    {person.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-foreground-muted">{person.detail}</p>
                  {person.meta && <p className="mt-0.5 text-xs text-foreground-muted">{person.meta}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
