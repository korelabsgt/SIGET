"use client";

import { useState } from "react";
import { ImageIcon, Loader2, ZoomIn } from "lucide-react";

import { GvImagenAmpliada } from "../lib/gv-imagen-ampliada";
import {
  resolveStorageDisplaySrc,
  useSignedStorageUrls,
} from "../lib/storage-hooks";
import { evidenciasBitacora } from "./lib/helpers";
import { cn } from "@/lib/utils";

const marcoReciboClass =
  "flex min-h-[11rem] w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-sky-50/70 to-zinc-100/60 ring-1 ring-zinc-200/90 dark:from-sky-950/25 dark:to-zinc-950 dark:ring-zinc-700";

export function BitacoraEvidenciaDetalle({ paths }: { paths: string[] }) {
  const cleaned = evidenciasBitacora({ evidencia_url: paths });
  const { data: signedMap = {}, isLoading, isError, refetch, isFetching } =
    useSignedStorageUrls(cleaned);
  const [rotas, setRotas] = useState<Record<string, boolean>>({});

  if (cleaned.length === 0) {
    return (
      <div className={cn(marcoReciboClass, "gap-2 py-8")}>
        <ImageIcon className="size-10 text-[#2c5f9b]/40 dark:text-[#6f9fd4]/50" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">Sin recibo de combustible</p>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className={marcoReciboClass}>
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    );
  }

  const path = cleaned[0]!;
  const src = resolveStorageDisplaySrc(path, signedMap);

  if (isError || !src || rotas[path]) {
    return (
      <div className={cn(marcoReciboClass, "gap-3 p-4")}>
        <p className="text-sm text-muted-foreground">No se pudo cargar el recibo.</p>
        <button
          type="button"
          onClick={() => {
            setRotas({});
            void refetch();
          }}
          className="inline-flex cursor-pointer items-center rounded-lg border-0 bg-celeste-trifinio px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <GvImagenAmpliada
        src={src}
        alt="Recibo de combustible"
        thumbFit="contain"
        onError={() => setRotas((prev) => ({ ...prev, [path]: true }))}
        thumbClassName="w-full"
      />
      <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <ZoomIn className="size-3.5 shrink-0 opacity-70" aria-hidden />
        Toca la imagen para ampliar
      </p>
    </div>
  );
}
