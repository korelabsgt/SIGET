"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownToLine, Download } from "lucide";
import { Loader2 } from "lucide-react";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { Switch } from "@/components/ui/switch";
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
      <div className="flex h-full min-h-[100dvh] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    ),
  },
);

function urlDescarga(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}dl=1`;
}

function iniciarDescarga(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = urlDescarga(url);
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function descargarArchivo(url: string, filename: string) {
  iniciarDescarga(url, filename);
}

function BarraDescargar({
  url,
  filename,
}: {
  url: string;
  filename: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[310] flex justify-center bg-gradient-to-t from-black/50 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10">
      <div className="pointer-events-auto">
        <SigetActionButton
          label="Descargar"
          accentColor={sigetAccent.excel}
          morphFrom={Download}
          morphTo={ArrowDownToLine}
          onClick={() => iniciarDescarga(url, filename)}
          ariaLabel="Descargar archivo"
          className="w-auto shrink-0"
        />
      </div>
    </div>
  );
}

function PdfVisorPantalla({
  url,
  filename,
}: {
  url: string;
  filename: string;
}) {
  const [doble, setDoble] = useState(false);

  return (
    <div className="fixed inset-0 z-[300] bg-zinc-200 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[310] hidden justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:flex">
        <label className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-celeste-trifinio/40 bg-white/90 py-1 pl-2.5 pr-1 dark:bg-zinc-900/90">
          <span className="text-[9px] font-bold uppercase tracking-wider text-celeste-trifinio">
            Doble
          </span>
          <Switch
            checked={doble}
            onCheckedChange={setDoble}
            aria-label="Ver dos páginas por fila"
            className="shadow-none data-[state=checked]:bg-celeste-trifinio data-[state=unchecked]:bg-zinc-300 dark:data-[state=unchecked]:bg-zinc-600"
          />
        </label>
      </div>
      <ManualPdfMobileViewer
        url={url}
        desktopFitHeight
        pagesPerView={doble ? 2 : 1}
      />
      <BarraDescargar url={url} filename={filename} />
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
      <PdfVisorPantalla url={url} filename={filename} />
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-4 text-sm text-muted-foreground">
      <p>Descargando {filename}…</p>
      <BarraDescargar url={url} filename={filename} />
    </div>
  );
}
