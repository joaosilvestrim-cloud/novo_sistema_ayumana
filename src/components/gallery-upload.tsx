"use client";

import { useRef, useState } from "react";
import { X, ImagePlus } from "lucide-react";

const MAX = 8;

/** Galeria de fotos: mantém as existentes (hidden inputs) e acumula novas via DataTransfer. */
export function GalleryUpload({
  filesName = "gallery_files",
  existingName = "gallery_existing",
  currentUrls = [],
}: {
  filesName?: string;
  existingName?: string;
  currentUrls?: string[];
}) {
  const [kept, setKept] = useState<string[]>(currentUrls);
  const [pending, setPending] = useState<{ url: string; file: File }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const total = kept.length + pending.length;

  function sync(list: { url: string; file: File }[]) {
    const dt = new DataTransfer();
    list.forEach((p) => dt.items.add(p.file));
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files || []);
    const room = Math.max(0, MAX - total);
    const next = [
      ...pending,
      ...chosen.slice(0, room).map((f) => ({ url: URL.createObjectURL(f), file: f })),
    ];
    setPending(next);
    sync(next);
  }

  function removePending(idx: number) {
    const next = pending.filter((_, i) => i !== idx);
    setPending(next);
    sync(next);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {kept.map((url) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Foto do consultório" className="h-full w-full object-cover" />
            <input type="hidden" name={existingName} value={url} />
            <button
              type="button"
              aria-label="Remover foto"
              onClick={() => setKept((k) => k.filter((u) => u !== url))}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {pending.map((p, i) => (
          <div key={p.url} className="relative aspect-square overflow-hidden rounded-lg border-2 border-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="Nova foto" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remover foto"
              onClick={() => removePending(i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {total < MAX && (
          <label
            htmlFor={filesName}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-foreground-muted transition-colors hover:bg-surface-muted"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">Adicionar</span>
          </label>
        )}
      </div>

      <input
        ref={inputRef}
        id={filesName}
        type="file"
        name={filesName}
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />

      <p className="mt-2 text-xs text-foreground-muted">
        Até {MAX} fotos do seu consultório ou ambiente. JPG ou PNG, até 5 MB cada.
      </p>
    </div>
  );
}
