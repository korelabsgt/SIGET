"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ArrowDownToLine, Download } from "lucide";
import { Loader2 } from "lucide-react";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { esImagenMime, esPdfMime, rutaRawArchivo } from "./lib/storage";
import { registerDownloadAction } from "./lib/actions";

const ManualPdfMobileViewer = dynamic(
  () => import("@/components/(base)/layout/modals/ManualPdfMobileViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[100dvh] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    ),
  },
);

export function ConocimientoArchivoVisor({
  slug,
  mime,
  filename,
}: {
  slug: string;
  mime: string;
  filename: string;
}) {
  const url = rutaRawArchivo(slug);
  const esPdf = esPdfMime(mime);
  const esImagen = esImagenMime(mime);

  useEffect(() => {
    if (esPdf || esImagen) return;
    void registerDownloadAction(slug);
    const a = document.createElement("a");
    a.href = rutaRawArchivo(slug, true);
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [esPdf, esImagen, filename, slug]);

  if (esPdf) {
    return (
      <div className="fixed inset-0 z-[300] bg-zinc-200 dark:bg-zinc-950">
        <div className="absolute right-3 top-3 z-[310]">
          <SigetActionButton
            label="Descargar"
            accentColor={sigetAccent.excel}
            morphFrom={ArrowDownToLine}
            morphTo={Download}
            onClick={() => {
              void registerDownloadAction(slug);
              const a = document.createElement("a");
              a.href = rutaRawArchivo(slug, true);
              a.download = filename;
              a.rel = "noopener";
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}
            className="w-auto shrink-0"
          />
        </div>
        <ManualPdfMobileViewer url={url} />
      </div>
    );
  }

  if (esImagen) {
    return (
      <div className="min-h-[100dvh] bg-zinc-200 dark:bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={filename} className="mx-auto w-full max-w-5xl" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      Descargando archivo…
    </div>
  );
}
