"use client";

import { motion } from "framer-motion";
import { Maximize2, Minimize2, X } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";
import { type Microcuenca } from "../lib/catalogos";
import { FOTOS_MICROCUENCA } from "../lib/fotos-microcuenca";
import { fichaPublica } from "../lib/publico-mock";
import { JaMapGaleriaSlider } from "../JaMapGaleriaSlider";
import type { ProyectoRecord } from "../lib/zod";

export function VisorDetallePanel({
  microcuenca,
  proyectos,
  ampliado,
  onAmpliar,
  onCerrar,
}: {
  microcuenca: Microcuenca;
  proyectos: ProyectoRecord[];
  ampliado: boolean;
  onAmpliar: () => void;
  onCerrar: () => void;
}) {
  const ficha = fichaPublica(microcuenca);
  const fotos = FOTOS_MICROCUENCA[microcuenca] ?? [];

  return (
    <motion.aside
      key={microcuenca}
      initial={{ opacity: 0, x: 28, width: "min(30rem, calc(100% - 1.5rem))" }}
      animate={{
        opacity: 1,
        x: 0,
        width: ampliado ? "50%" : "min(30rem, calc(100% - 1.5rem))",
      }}
      exit={{ opacity: 0, x: 28 }}
      transition={{
        x: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
        width: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
      }}
      className="pointer-events-auto absolute inset-y-3 right-3 z-1000 overflow-y-auto overscroll-contain rounded-2xl border border-zinc-200/90 bg-white/95 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95"
    >
      <div className="flex flex-col gap-3 px-5 py-4">
        <header className="border-b border-zinc-200/80 pb-4 dark:border-zinc-700">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Microcuenca
              </p>
              <h2 className="truncate text-lg font-black text-[#003882] dark:text-[#6f9fd4]">
                {ficha.microcuenca}
              </h2>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {ficha.municipio}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <SigetActionButton
                label={ampliado ? "Reducir" : "Ampliar"}
                accentColor={sigetAccent.activa}
                morphFrom={ampliado ? Minimize2 : Maximize2}
                morphTo={ampliado ? Maximize2 : Minimize2}
                onClick={onAmpliar}
                ariaLabel={ampliado ? "Reducir panel" : "Ampliar panel"}
                className="w-auto shrink-0"
              />
              <SigetActionButton
                label="Cerrar"
                accentColor={sigetAccent.cancelar}
                morphFrom={X}
                morphTo={X}
                onClick={onCerrar}
                ariaLabel="Cerrar detalle de microcuenca"
                className="w-auto shrink-0"
              />
            </div>
          </div>
          <div className="mt-4">
            <JaMapGaleriaSlider
              fotos={fotos}
              titulo={`Comunidad · ${microcuenca}`}
            />
            <div>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {ficha.descripcion}
              </p>
              <dl className="mt-4 grid grid-cols-1 gap-2">
                <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                  <dt className="text-[10px] font-black uppercase tracking-wide text-[#C59B27]">
                    Comunidades
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {ficha.comunidades.join(", ")}
                  </dd>
                </div>
                <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                  <dt className="text-[10px] font-black uppercase tracking-wide text-[#1B5E20]">
                    Afluentes
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {ficha.afluentes}
                  </dd>
                </div>
                <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                  <dt className="text-[10px] font-black uppercase tracking-wide text-[#1B5E20]">
                    Recarga
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {ficha.recarga}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </header>
        <section>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-[#2c5f9b] dark:text-[#6f9fd4]">
              Pilotos
            </h3>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {proyectos.length}
            </span>
          </div>
          {proyectos.length === 0 ? (
            <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
              Sin pilotos visibles en esta microcuenca.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {proyectos.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800/80"
                >
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{row.nombre}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {row.comunidad} · {row.agencia} · {row.avance_fisico}%
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </motion.aside>
  );
}
