"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Image as ImageIcon, Link as LinkIcon, MapPin } from "lucide-react";
import { ArrowUpRight, ExternalLink } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import {
  armarArbolArchivos,
  esImagenMime,
  esPdfMime,
  pesoArchivoLegible,
  type ArchivoArbol,
  type ArchivoNodo,
  type ArchivosPorToken,
} from "./lib/archivos";
import { formatFechaActividad, formatUbicacionActividad } from "./lib/zod";

function iconoNodo(nodo: ArchivoNodo, abierto: boolean) {
  if (nodo.tipo === "carpeta") return abierto ? FolderOpen : Folder;
  if (nodo.tipo === "enlace") return LinkIcon;
  if (esImagenMime(nodo.mime)) return ImageIcon;
  return FileText;
}

function NodoPublico({
  nodo,
  urls,
  profundidad,
  expandidos,
  onToggle,
}: {
  nodo: ArchivoArbol;
  urls: Record<string, string>;
  profundidad: number;
  expandidos: Set<string>;
  onToggle: (id: string) => void;
}) {
  const abierto = expandidos.has(nodo.id);
  const esCarpeta = nodo.tipo === "carpeta";
  const Icono = iconoNodo(nodo, abierto);
  const url = urls[nodo.id];

  return (
    <li className="min-w-0">
      <div
        className="flex flex-col gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900 sm:flex-row sm:items-center"
        style={{ marginLeft: profundidad * 16 }}
      >
        <button
          type="button"
          onClick={() => {
            if (esCarpeta) onToggle(nodo.id);
            else if (url) window.open(url, "_blank", "noopener,noreferrer");
          }}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 border-0 bg-transparent p-0 text-left"
        >
          {esCarpeta ? (
            abierto ? (
              <ChevronDown className="mt-0.5 size-4 shrink-0 text-celeste-trifinio" />
            ) : (
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-celeste-trifinio" />
            )
          ) : (
            <span className="mt-0.5 size-4 shrink-0" />
          )}
          <Icono className="mt-0.5 size-4 shrink-0 text-celeste-trifinio" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-foreground">
              {nodo.nombre}
            </span>
            {nodo.descripcion ? (
              <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                {nodo.descripcion}
              </span>
            ) : null}
            {nodo.tipo === "archivo" ? (
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {[nodo.nombre_archivo, pesoArchivoLegible(nodo.tamano)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            ) : null}
            {nodo.tipo === "enlace" ? (
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Enlace
              </span>
            ) : null}
          </span>
        </button>
        {url ? (
          <SigetActionButton
            label="Abrir"
            accentColor={sigetAccent.abrir}
            morphFrom={ExternalLink}
            morphTo={ArrowUpRight}
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            ariaLabel="Abrir archivo"
            className="w-auto shrink-0 self-end sm:self-center"
          />
        ) : null}
      </div>
      {esCarpeta && abierto && nodo.hijos.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {nodo.hijos.map((hijo) => (
            <NodoPublico
              key={hijo.id}
              nodo={hijo}
              urls={urls}
              profundidad={profundidad + 1}
              expandidos={expandidos}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ArchivosPublicos({ data }: { data: ArchivosPorToken }) {
  const arbol = useMemo(() => {
    if (data.alcance === "archivo" && data.nodo) {
      return armarArbolArchivos([data.nodo]);
    }
    if (data.alcance === "carpeta" && data.nodo) {
      return armarArbolArchivos(data.nodos);
    }
    return armarArbolArchivos(data.nodos);
  }, [data]);

  const [expandidos, setExpandidos] = useState<Set<string>>(
    () => new Set(data.nodos.filter((n) => n.tipo === "carpeta").map((n) => n.id)),
  );

  const toggle = (id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const archivoUnico =
    data.alcance === "archivo" && data.nodo ? data.nodo : null;
  const urlUnico = archivoUnico ? data.urls[archivoUnico.id] : null;
  const ubicacion = formatUbicacionActividad(data.actividad);
  const titulo =
    data.alcance === "actividad"
      ? "Archivos públicos"
      : data.nodo?.nombre ?? "Archivos públicos";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900">
        <div className="bg-celeste-trifinio pt-1">
          <div className="overflow-hidden rounded-t-2xl bg-card px-4 py-4 dark:bg-zinc-900">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {titulo}
            </p>
            <h1 className="text-lg font-black leading-tight text-foreground sm:text-xl">
              {data.actividad.nombre}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold capitalize text-celeste-trifinio">
                <Calendar className="size-3.5 shrink-0" />
                {formatFechaActividad(data.actividad.fecha_realizacion)}
              </span>
              {ubicacion ? (
                <span className="inline-flex min-w-0 max-w-full items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0 text-celeste-trifinio/80" />
                  <span className="truncate">{ubicacion}</span>
                </span>
              ) : null}
            </div>
            {data.nodo?.descripcion ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {data.nodo.descripcion}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {archivoUnico && urlUnico && esImagenMime(archivoUnico.mime) ? (
        <a
          href={urlUnico}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 block overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700"
        >
          <img
            src={urlUnico}
            alt={archivoUnico.nombre}
            className="mx-auto max-h-[70vh] w-auto max-w-full object-contain"
          />
        </a>
      ) : null}

      {archivoUnico && urlUnico && esPdfMime(archivoUnico.mime) ? (
        <iframe
          title={archivoUnico.nombre}
          src={urlUnico}
          className="mb-6 h-[70vh] w-full rounded-2xl border border-border bg-white dark:border-zinc-700"
        />
      ) : null}

      {arbol.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-16 text-center text-sm text-muted-foreground dark:border-zinc-700">
          No hay archivos públicos para mostrar.
        </div>
      ) : (
        <ul className="space-y-2">
          {arbol.map((nodo) => (
            <NodoPublico
              key={nodo.id}
              nodo={nodo}
              urls={data.urls}
              profundidad={0}
              expandidos={expandidos}
              onToggle={toggle}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
