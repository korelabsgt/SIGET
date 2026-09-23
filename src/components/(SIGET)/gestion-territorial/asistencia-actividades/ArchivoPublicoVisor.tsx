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

function CargandoConPorcentaje({ pct }: { pct: number }) {
  const mostrado = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-4 px-6">
      <div
        className="relative size-24"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={mostrado}
        aria-label="Cargando archivo"
      >
        <svg viewBox="0 0 96 96" className="size-24 -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            className="stroke-zinc-200 dark:stroke-zinc-700"
            strokeWidth="8"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="#1a95d3"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={2 * Math.PI * 40 * (1 - mostrado / 100)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-black tabular-nums text-[#1a4d7a] dark:text-[#6f9fd4]">
          {mostrado}%
        </span>
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Cargando
      </p>
    </div>
  );
}

function useArchivoParaMostrar(url: string) {
  const [pct, setPct] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const objectUrlRef: { current: string | null } = { current: null };

    const cargar = async () => {
      setPct(0);
      setBlobUrl(null);
      setError(false);
      try {
        const res = await fetch(url, { credentials: "same-origin" });
        if (!res.ok || !res.body) throw new Error("fetch");
        const total = Number(res.headers.get("content-length") ?? 0);
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let recibidos = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (cancelado) {
            await reader.cancel();
            return;
          }
          chunks.push(value);
          recibidos += value.byteLength;
          if (total > 0) {
            setPct(Math.min(99, Math.round((recibidos / total) * 100)));
          } else {
            setPct((prev) => Math.min(90, prev + 3));
          }
        }

        const mime = res.headers.get("content-type") || undefined;
        const blob = new Blob(chunks, mime ? { type: mime } : undefined);
        const creado = URL.createObjectURL(blob);
        objectUrlRef.current = creado;
        if (cancelado) {
          URL.revokeObjectURL(creado);
          return;
        }
        setPct(100);
        setBlobUrl(creado);
      } catch {
        if (!cancelado) setError(true);
      }
    };

    void cargar();

    return () => {
      cancelado = true;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [url]);

  return { pct, blobUrl, error };
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

function ImagenVisorPantalla({
  url,
  alt,
  filename,
}: {
  url: string;
  alt: string;
  filename: string;
}) {
  const { pct, blobUrl, error } = useArchivoParaMostrar(url);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 text-sm text-zinc-300">
        No se pudo cargar la imagen.
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="fixed inset-0 z-[300] bg-black">
        <CargandoConPorcentaje pct={pct} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] overflow-auto bg-black touch-pan-x touch-pan-y md:flex md:items-center md:justify-center">
      <img
        src={blobUrl}
        alt={alt}
        className="block h-auto w-full max-w-none select-none md:h-auto md:max-h-full md:w-auto md:max-w-full md:object-contain"
      />
      <BarraDescargar url={url} filename={filename} />
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
  const { pct, blobUrl, error } = useArchivoParaMostrar(url);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4 text-sm text-muted-foreground">
        No se pudo cargar el archivo.
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="fixed inset-0 z-[300] bg-zinc-200 dark:bg-zinc-950">
        <CargandoConPorcentaje pct={pct} />
      </div>
    );
  }

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
        url={blobUrl}
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
      <ImagenVisorPantalla
        url={url}
        alt={nodo.nombre}
        filename={filename}
      />
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
