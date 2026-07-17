"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { AvatarBubble } from "@/components/ui/avatar-bubble";

/** Upload da foto de perfil com pré-visualização no balão da marca. */
export function AvatarUpload({
  name,
  currentUrl,
  displayName,
  seed,
}: {
  name: string;
  currentUrl?: string | null;
  displayName?: string | null;
  seed?: string;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  return (
    <div className="flex items-center gap-4">
      <AvatarBubble src={preview} name={displayName ?? null} seed={seed} size={120} className="w-24 shrink-0" />
      <div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted">
          <Upload className="h-4 w-4" />
          {preview ? "Trocar foto" : "Enviar foto"}
          <input
            type="file"
            name={name}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPreview(URL.createObjectURL(f));
            }}
          />
        </label>
        <p className="mt-1.5 text-xs text-foreground-muted">
          JPG ou PNG, de preferência quadrada. Até 5 MB.
        </p>
      </div>
    </div>
  );
}
