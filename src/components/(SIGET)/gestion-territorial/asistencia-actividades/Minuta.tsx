"use client";

import { useEffect, useState } from "react";
import { MorphIcon } from "morphicons/react";
import type { IconNode } from "lucide";
import { FileText, List, LogIn, Play } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { formatFechaActividad } from "./lib/zod";
import {
  minutaTieneContenido,
  resumenAcuerdos,
  htmlATexto,
  type MinutaRecord,
} from "./lib/minuta";

const MINUTA_INICIO_ICONOS: IconNode[] = [FileText, Play, List];

function MinutaInicioIcono({ indice }: { indice: number }) {
  return (
    <MorphIcon
      icon={MINUTA_INICIO_ICONOS[indice % MINUTA_INICIO_ICONOS.length]}
      size={38}
      color={sigetAccent.crear}
      strokeWidth={1.75}
      spring="snappy"
    />
  );
}

function ElaboradoPorValor({ texto }: { texto: string }) {
  const separador = " | ";
  const indice = texto.indexOf(separador);
  if (indice === -1) {
    return <span className="text-foreground">{texto}</span>;
  }
  return (
    <span className="text-foreground">
      {texto.slice(0, indice)}
      {separador}
      <span className="font-bold">{texto.slice(indice + separador.length)}</span>
    </span>
  );
}

export function Minuta({
  minuta,
  listo,
  onAbrir,
}: {
  minuta: MinutaRecord | null;
  listo: boolean;
  onAbrir: () => void;
}) {
  const [hoverInicio, setHoverInicio] = useState(false);
  const [iconoTick, setIconoTick] = useState(0);

  useEffect(() => {
    if (!hoverInicio) return;
    const id = window.setInterval(() => {
      setIconoTick((t) => t + 1);
    }, 1200);
    return () => clearInterval(id);
  }, [hoverInicio]);

  const existe = listo && minuta !== null && minutaTieneContenido(minuta);
  const acuerdosResumen = minuta ? resumenAcuerdos(minuta) : [];
  const totalAcuerdos = minuta?.acuerdos.length ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col rounded-2xl border border-dashed border-slate-300/80 bg-zinc-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
        {!listo ? (
          <p className="m-auto text-center text-sm text-muted-foreground">
            Cargando…
          </p>
        ) : !existe ? (
          <button
            type="button"
            onClick={onAbrir}
            onPointerEnter={() => {
              setHoverInicio(true);
              setIconoTick(1);
            }}
            onPointerLeave={() => {
              setHoverInicio(false);
              setIconoTick(0);
            }}
            aria-label="Iniciar minuta"
            className="m-auto flex w-full max-w-xs cursor-pointer flex-col items-center gap-5 rounded-2xl border border-slate-200/70 bg-white px-6 py-8 text-center shadow-sm transition-colors hover:bg-zinc-50/90 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80"
          >
            <span className="flex size-18 items-center justify-center rounded-2xl bg-linear-to-br from-sky-50 to-sky-100/80 ring-1 ring-sky-200/60 dark:from-sky-950/50 dark:to-sky-900/30 dark:ring-sky-800/50">
              <MinutaInicioIcono indice={iconoTick} />
            </span>

            <div className="space-y-1.5">
              <p className="text-base font-black tracking-tight text-[#2c5f9b] dark:text-[#6f9fd4]">
                Iniciar minuta
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Documenta acuerdos, compromisos y responsables de esta actividad.
              </p>
            </div>
          </button>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <span className="font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">
                  Fecha:{" "}
                </span>
                <span className="text-foreground">
                  {formatFechaActividad(minuta!.fecha)}
                </span>
              </div>
              <div>
                <span className="font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">
                  Institución:{" "}
                </span>
                <span className="text-foreground">{minuta!.institucion}</span>
              </div>
              {minuta!.elaboro.trim() ? (
                <div className="sm:col-span-2">
                  <span className="font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">
                    Elaborado por:{" "}
                  </span>
                  <ElaboradoPorValor texto={minuta!.elaboro.trim()} />
                </div>
              ) : null}
            </div>

            {htmlATexto(minuta!.introduccion) ? (
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Introducción
                </p>
                <p className="line-clamp-3 text-xs leading-relaxed text-foreground">
                  {htmlATexto(minuta!.introduccion)}
                </p>
              </div>
            ) : null}

            {totalAcuerdos > 0 ? (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Acuerdos ({totalAcuerdos})
                </p>
                <ul className="space-y-1.5">
                  {acuerdosResumen.map((linea, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-xs text-foreground before:shrink-0 before:font-bold before:text-[#2c5f9b] before:content-['•'] dark:before:text-[#6f9fd4]"
                    >
                      <span className="line-clamp-2">{linea}</span>
                    </li>
                  ))}
                  {totalAcuerdos > acuerdosResumen.length ? (
                    <li className="text-xs text-muted-foreground">
                      +{totalAcuerdos - acuerdosResumen.length} acuerdos más
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            {htmlATexto(minuta!.compromisosGenerales) ? (
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Compromisos generales
                </p>
                <p className="line-clamp-2 text-xs leading-relaxed text-foreground">
                  {htmlATexto(minuta!.compromisosGenerales)}
                </p>
              </div>
            ) : null}

            <div className="mt-auto flex justify-center pt-4">
              <SigetActionButton
                label="Entrar"
                accentColor={sigetAccent.abrir}
                morphFrom={LogIn}
                morphTo={FileText}
                onClick={onAbrir}
                ariaLabel="Ver minuta completa"
                className="w-auto shrink-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
