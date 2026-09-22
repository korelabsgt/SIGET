"use client";

import { useEffect } from "react";
import ManualPdfMobileViewer from "@/components/(base)/layout/modals/ManualPdfMobileViewer";
import {
  esImagenMime,
  esPdfMime,
  type ArchivoNodo,
} from "./lib/archivos";

export function ArchivoPublicoVisor({
  nodo,
  url,
}: {
  nodo: ArchivoNodo;
  url: string;
}) {
  const esImagen = esImagenMime(nodo.mime);
  const esPdf = esPdfMime(nodo.mime);

  useEffect(() => {
    if (nodo.tipo === "enlace") {
      window.location.replace(url);
      return;
    }
    if (esImagen || esPdf) return;

    let cancelado = false;
    const descargar = async () => {
      try {
        const res = await fetch(url, { credentials: "same-origin" });
        if (!res.ok) throw new Error("fetch");
        const blob = await res.blob();
        if (cancelado) return;
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = nodo.nombre_archivo || nodo.nombre;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
      } catch {
        if (!cancelado) window.location.assign(url);
      }
    };
    void descargar();
    return () => {
      cancelado = true;
    };
  }, [esImagen, esPdf, nodo.nombre, nodo.nombre_archivo, nodo.tipo, url]);

  if (nodo.tipo === "enlace") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4 text-sm text-muted-foreground">
        Abriendo enlace…
      </div>
    );
  }

  if (esImagen) {
    return (
      <div className="fixed inset-0 z-[300] overflow-auto bg-black touch-pan-x touch-pan-y">
        <img
          src={url}
          alt={nodo.nombre}
          className="block h-auto w-full max-w-none select-none"
        />
      </div>
    );
  }

  if (esPdf) {
    return (
      <div className="fixed inset-0 z-[300] bg-zinc-200 dark:bg-zinc-950">
        <ManualPdfMobileViewer url={url} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 text-sm text-muted-foreground">
      Descargando {nodo.nombre_archivo || nodo.nombre}…
    </div>
  );
}
