"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Loader2, UploadCloud, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/field";
import { compressImage, setInputFiles } from "@/lib/image-compress";
import { saveCrpDocumentAction } from "./actions";

type Status = "idle" | "saving" | "saved" | "error";

export function CrpDocumentUpload({ hasDocInitial }: { hasDocInitial: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [salvo, setSalvo] = useState(hasDocInitial);
  const [status, setStatus] = useState<Status>(hasDocInitial ? "saved" : "idle");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const f = input.files?.[0];
    if (!f) {
      setFileName("");
      return;
    }
    setStatus("idle");
    setMsg("");
    // Foto da carteirinha é comprimida mantendo a legibilidade. PDF passa direto.
    if (f.type.startsWith("image/")) {
      const out = await compressImage(f, { maxDim: 2200, quality: 0.85 });
      if (out !== f) setInputFiles(input, [out]);
    }
    setFileName(input.files?.[0]?.name ?? f.name);
  }

  function salvar() {
    const f = inputRef.current?.files?.[0];
    if (!f) {
      setStatus("error");
      setMsg("Escolha o arquivo do documento antes de salvar.");
      return;
    }
    const fd = new FormData();
    fd.set("crp_document", f);
    setStatus("saving");
    setMsg("");
    start(async () => {
      const res = await saveCrpDocumentAction(fd);
      if (res.ok) {
        setStatus("saved");
        setSalvo(true);
        setMsg("");
        setFileName("");
        if (inputRef.current) inputRef.current.value = "";
      } else {
        setStatus("error");
        setMsg(res.error || "Não foi possível salvar o documento.");
      }
    });
  }

  const temArquivo = !!fileName;

  return (
    <div className="space-y-2">
      {/* Estado atual do documento */}
      {salvo && status !== "idle" ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          <Check className="h-4 w-4 shrink-0" />
          Documento salvo. Envie outro abaixo se quiser substituir.
        </div>
      ) : hasDocInitial ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          <Check className="h-4 w-4 shrink-0" />
          Já existe um documento enviado. Envie outro abaixo para substituir.
        </div>
      ) : null}

      <Input
        ref={inputRef}
        id="crp_document"
        name="crp_document"
        type="file"
        accept=".pdf,image/*"
        className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:text-heading"
        onChange={onChange}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={salvar}
          disabled={pending || !temArquivo}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "saving" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando documento...
            </>
          ) : status === "saved" && !temArquivo ? (
            <>
              <Check className="h-4 w-4" /> Documento salvo
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" /> Salvar documento
            </>
          )}
        </button>

        {status === "saved" && !temArquivo && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
            <Check className="h-4 w-4" /> Salvo com sucesso
          </span>
        )}
        {status === "error" && (
          <span className="inline-flex items-center gap-1 text-sm text-danger">
            <AlertCircle className="h-4 w-4" /> {msg}
          </span>
        )}
        {temArquivo && status !== "saving" && (
          <span className="truncate text-xs text-foreground-muted">Pronto para salvar: {fileName}</span>
        )}
      </div>

      <p className="text-xs text-foreground-muted">
        PDF ou imagem (carteira/e-Psi), até 10 MB. Este botão salva só o documento na hora. Salvar o documento não envia para verificação.
      </p>
    </div>
  );
}
