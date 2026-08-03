"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MESES_CORTOS,
  avanzarFiltroPeriodo,
  formatFiltroPeriodoLabel,
} from "./lib/helpers";
import type { FiltroPeriodoMemoria } from "./lib/zod";

const segmentBtnClass =
  "flex items-center justify-center text-foreground transition-colors hover:bg-muted/60 cursor-pointer dark:hover:bg-zinc-800";

type MemoriaPeriodoFiltroProps = {
  value: FiltroPeriodoMemoria;
  onChange: (value: FiltroPeriodoMemoria) => void;
  ordenDesc: boolean;
  onOrdenToggle: () => void;
  className?: string;
};

export function MemoriaPeriodoFiltro({
  value,
  onChange,
  ordenDesc,
  onOrdenToggle,
  className,
}: MemoriaPeriodoFiltroProps) {
  const [abierto, setAbierto] = useState(false);
  const [anioPicker, setAnioPicker] = useState(value.anio);
  const panelRef = useRef<HTMLDivElement>(null);
  const etiqueta = formatFiltroPeriodoLabel(value);

  useEffect(() => {
    if (!abierto) return;
    setAnioPicker(value.anio);
  }, [abierto, value.anio]);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  const seleccionarMes = (mes: number) => {
    onChange({ anio: anioPicker, mes });
    setAbierto(false);
  };

  const seleccionarAnioCompleto = () => {
    onChange({ anio: anioPicker, mes: null });
    setAbierto(false);
  };

  return (
    <div className={cn("flex w-full min-w-0 items-stretch justify-center gap-2 lg:w-auto lg:justify-start", className)}>
      <div className="relative w-auto shrink-0" ref={panelRef}>
        <div className="flex h-10 w-auto items-stretch overflow-hidden rounded-xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900">
          <button
            type="button"
            aria-label="Período anterior"
            onClick={() => onChange(avanzarFiltroPeriodo(value, -1))}
            className={cn(
              segmentBtnClass,
              "w-9 shrink-0 border-r border-border dark:border-zinc-700",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className={cn(
              segmentBtnClass,
              "gap-1.5 border-r border-border px-3 text-sm font-bold whitespace-nowrap dark:border-zinc-700",
            )}
          >
            <motion.span
              key={etiqueta}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="truncate"
            >
              {etiqueta}
            </motion.span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                abierto && "rotate-180",
              )}
            />
          </button>

          <button
            type="button"
            aria-label="Período siguiente"
            onClick={() => onChange(avanzarFiltroPeriodo(value, 1))}
            className={cn(segmentBtnClass, "w-9 shrink-0")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <AnimatePresence>
          {abierto && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[18rem] rounded-2xl border border-border bg-card p-4 dark:border-zinc-700 dark:bg-zinc-900 max-sm:left-0 max-sm:right-0 max-sm:w-auto"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setAnioPicker((a) => a - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted/60 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <motion.span
                  key={anioPicker}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm font-black text-foreground"
                >
                  {anioPicker}
                </motion.span>
                <button
                  type="button"
                  onClick={() => setAnioPicker((a) => a + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted/60 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={seleccionarAnioCompleto}
                className={cn(
                  "mb-3 w-full rounded-lg border px-3 py-2 text-xs font-bold transition-all duration-200 cursor-pointer",
                  value.anio === anioPicker && value.mes === null
                    ? "border-azul-trifinio bg-azul-trifinio/10 text-azul-trifinio"
                    : "border-border text-foreground hover:bg-muted/50 dark:border-zinc-700",
                )}
              >
                Todo el año {anioPicker}
              </button>

              <div className="grid grid-cols-3 gap-1.5">
                {MESES_CORTOS.map((nombre, index) => {
                  const mes = index + 1;
                  const activo =
                    value.anio === anioPicker && value.mes === mes;
                  return (
                    <motion.button
                      key={nombre}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => seleccionarMes(mes)}
                      className={cn(
                        "rounded-lg px-2 py-2 text-xs font-bold transition-colors duration-200 cursor-pointer",
                        activo
                          ? "bg-azul-trifinio text-white"
                          : "text-foreground hover:bg-muted/60 dark:hover:bg-zinc-800",
                      )}
                    >
                      {nombre}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={onOrdenToggle}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-muted/60 cursor-pointer dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        Ordenar
        <motion.span
          key={ordenDesc ? "desc" : "asc"}
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 0.2 }}
        >
          {ordenDesc ? (
            <ArrowDown className="h-4 w-4 text-celeste-trifinio" />
          ) : (
            <ArrowUp className="h-4 w-4 text-celeste-trifinio" />
          )}
        </motion.span>
      </motion.button>
    </div>
  );
}
