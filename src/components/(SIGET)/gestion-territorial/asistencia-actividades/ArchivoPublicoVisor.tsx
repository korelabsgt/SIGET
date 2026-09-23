"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownToLine, Download } from "lucide";
import { Loader2 } from "lucide-react";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import {
  esImagenMime,
  esPdfMime,
  type ArchivoNodo,
} from "./lib/archivos";

const ManualPdfMobileViewer = dynamic(
  () => import("@/components/(base)/layout/modals/ManualPdfMobileViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    ),
  },
);

function urlDescarga(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}dl=1`;
}

async function descargarArchivo(url: string, filename: string) {
  const res = await fetch(urlDescarga(url), { credentials: "same-origin" });
  if (!res.ok) throw new Error("fetch");
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

function BarraDescargar({
  url,
  filename,
}: {
  url: string;
  filename: string;
}) {
  const [ocupado, setOcupado] = useState(false);

  const onDescargar = useCallback(async () => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await descargarArchivo(url, filename);
    } catch {
      window.location.assign(urlDescarga(url));
    } finally {
      setOcupado(false);
    }
  }, [filename, ocupado, url]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[310] flex justify-center bg-gradient-to-t from-black/50 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10">
      <div className="pointer-events-auto">
        <SigetActionButton
          label="Descargar"
          accentColor={sigetAccent.excel}
          morphFrom={Download}
          morphTo={ArrowDownToLine}
          onClick={() => void onDescargar()}
          disabled={ocupado}
          ariaBusy={ocupado}
          ariaLabel="Descargar archivo"
          className="w-auto shrink-0"
        />
      </div>
    </div>
  );
}

export function ArchivoPublicoVisor({
  nodo,
  url,
}: {
  nodo: ArchivoNodo;
  url: string;
}) {
  const esImagen = esImagenMime(nodo.mime);
  const esPdf = esPdfMime(nodo.mime);
  const filename = nodo.nombre_archivo || nodo.nombre;

  useEffect(() => {
    if (nodo.tipo === "enlace") {
      window.location.replace(url);
      return;
    }
    if (esImagen || esPdf) return;

    let cancelado = false;
    void descargarArchivo(url, filename).catch(() => {
      if (!cancelado) window.location.assign(urlDescarga(url));
    });
    return () => {
      cancelado = true;
    };
  }, [esImagen, esPdf, filename, nodo.tipo, url]);

  if (nodo.tipo === "enlace") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4 text-sm text-muted-foreground">
        Abriendo enlace…
      </div>
    );
  }

  if (esImagen) {
    return (
      <div className="fixed inset-0 z-[300] overflow-auto bg-black touch-pan-x touch-pan-y md:flex md:items-center md:justify-center">
        <img
          src={url}
          alt={nodo.nombre}
          className="block h-auto w-full max-w-none select-none md:h-auto md:max-h-full md:w-auto md:max-w-full md:object-contain"
        />
        <BarraDescargar url={url} filename={filename} />
      </div>
    );
  }

  if (esPdf) {
    return (
      <div className="fixed inset-0 z-[300] bg-zinc-200 dark:bg-zinc-950">
        <ManualPdfMobileViewer url={url} desktopFitHeight />
        <BarraDescargar url={url} filename={filename} />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-4 text-sm text-muted-foreground">
      <p>Descargando {filename}…</p>
      <BarraDescargar url={url} filename={filename} />
    </div>
  );
}
