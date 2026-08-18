// Compressão de imagem no navegador, antes do upload. Resolve o teto de ~4,5MB
// da Vercel para Server Actions: foto de celular (5-8MB) vira uns 300KB e sobe
// em qualquer caso. Roda só no cliente (usa canvas). Nunca lança: se algo
// falhar, devolve o arquivo original para não travar o formulário.

export async function compressImage(
  file: File,
  opts: { maxDim?: number; quality?: number } = {}
): Promise<File> {
  const { maxDim = 1600, quality = 0.82 } = opts;

  // Só imagens rasterizadas. PDF, SVG e afins passam direto.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  // Já pequena o bastante: não mexe, para não perder qualidade à toa.
  if (file.size < 500_000) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * escala);
    const height = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file; // não ajudou: fica o original

    const nome = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nome, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}

/** Troca os arquivos de um <input type=file> pelo resultado (via DataTransfer). */
export function setInputFiles(input: HTMLInputElement, files: File[]) {
  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));
  input.files = dt.files;
}
