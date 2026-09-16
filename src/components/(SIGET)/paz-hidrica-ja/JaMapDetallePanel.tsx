"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { FileText, Maximize2, Minimize2, Plus, Trash2, X } from "lucide";
import { modalFieldClass, toast } from "@/components/ui/general-modal";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import {
  formatFechaCalendarioGt,
  formatFechaCompactaGt,
  mesCalendarioGt,
} from "@/lib/fechas-gt";
import { cn } from "@/lib/utils";
import { MICROCUENCA_MUNICIPIO, type Microcuenca } from "./lib/catalogos";
import {
  etiquetaAcuerdo,
  etiquetaFase,
  registroEnMesCalendario,
  totalPoblacion,
} from "./lib/helpers";
import { puede } from "./lib/permisos";
import { useQuitarProceso } from "./lib/hooks";
import { JaMapGaleriaSlider } from "./JaMapGaleriaSlider";
import { FOTOS_MICROCUENCA } from "./lib/fotos-microcuenca";
import { SemaforoBadge } from "./lib/ui";
import { CrearProceso } from "./forms/CrearProceso";
import type { JaStoreState, RolJaPersistido } from "./lib/zod";

function SeccionLista({
  titulo,
  total,
  vacio,
  action,
  children,
}: {
  titulo: string;
  total: number;
  vacio: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-zinc-200/80 pt-3 dark:border-zinc-700">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-[#2c5f9b] dark:text-[#6f9fd4]">
          {titulo}
        </h3>
        <div className="flex items-center gap-2">
          {action}
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {total}
          </span>
        </div>
      </div>
      {total === 0 ? (
        <p className="text-xs italic text-zinc-500 dark:text-zinc-400">{vacio}</p>
      ) : (
        <ul className="flex flex-col gap-2">{children}</ul>
      )}
    </section>
  );
}

function ItemTarjeta({
  titulo,
  subtitulo,
  fecha,
  badge,
  action,
}: {
  titulo: string;
  subtitulo?: string;
  fecha?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <li className="overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800/80">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-zinc-900 dark:text-zinc-100">
          {titulo}
        </p>
        {fecha ? (
          <span className="shrink-0 font-mono text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
            {fecha}
          </span>
        ) : null}
      </div>
      {badge ? <div className="mt-1.5">{badge}</div> : null}
      {subtitulo ? (
        <p className="mt-1.5 text-xs leading-snug text-zinc-600 dark:text-zinc-400">
          {subtitulo}
        </p>
      ) : null}
      {action ? <div className="mt-2 flex flex-wrap gap-2">{action}</div> : null}
    </li>
  );
}

export function JaMapDetallePanel({
  microcuenca,
  state,
  rol,
  ampliado,
  onAmpliar,
  onCerrar,
}: {
  microcuenca: Microcuenca;
  state: JaStoreState;
  rol: RolJaPersistido;
  ampliado: boolean;
  onAmpliar: () => void;
  onCerrar: () => void;
}) {
  const [mesPeriodo, setMesPeriodo] = useState(mesCalendarioGt);
  const [crearProceso, setCrearProceso] = useState(false);
  const quitarProceso = useQuitarProceso();

  const datos = useMemo(() => {
    const incidentesBase = state.incidentes.filter((r) => r.microcuenca === microcuenca);
    const sesionesBase = state.sesiones.filter((r) => r.microcuenca === microcuenca);
    const proyectosBase = state.proyectos.filter((r) => r.microcuenca === microcuenca);
    const acuerdosBase = state.acuerdos.filter((a) => {
      const inc = state.incidentes.find((i) => i.id === a.incidente_id);
      return inc?.microcuenca === microcuenca;
    });
    const metodologias = state.metodologias.filter(
      (r) => r.microcuenca === microcuenca || r.microcuenca == null,
    );
    const organizaciones = state.organizaciones.filter(
      (r) => r.municipio === MICROCUENCA_MUNICIPIO[microcuenca],
    );
    const procesos = (state.procesos ?? []).filter((r) => r.microcuenca === microcuenca);

    const incidentes = incidentesBase.filter((r) => registroEnMesCalendario(r.fecha, mesPeriodo));
    const sesiones = sesionesBase.filter((r) => registroEnMesCalendario(r.fecha, mesPeriodo));
    const acuerdos = acuerdosBase.filter((r) =>
      registroEnMesCalendario(r.fecha_limite, mesPeriodo),
    );
    const proyectos = proyectosBase.filter((r) =>
      registroEnMesCalendario(r.created_at, mesPeriodo),
    );
    const procesosPeriodo = procesos.filter((r) => registroEnMesCalendario(r.fecha, mesPeriodo));
    const poblacion = incidentes.reduce((acc, r) => acc + totalPoblacion(r), 0);

    return {
      incidentes,
      sesiones,
      proyectos,
      acuerdos,
      metodologias,
      organizaciones,
      procesos: procesosPeriodo,
      poblacion,
    };
  }, [microcuenca, mesPeriodo, state]);

  const municipio = MICROCUENCA_MUNICIPIO[microcuenca];
  const periodoLabel = formatFechaCalendarioGt(`${mesPeriodo}-01`, {
    month: "long",
    year: "numeric",
  });

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
                {microcuenca}
              </h2>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{municipio}</p>
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

          <div className={cn("mt-4", ampliado && "grid gap-4 md:grid-cols-2")}>
            <JaMapGaleriaSlider
              fotos={FOTOS_MICROCUENCA[microcuenca]}
              titulo={`Comunidad · ${microcuenca}`}
            />

            <div>
              <label
                htmlFor={`ja-mapa-periodo-${microcuenca}`}
                className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#2c5f9b] dark:text-[#6f9fd4]"
              >
                Periodo
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-[#2c5f9b] dark:text-[#6f9fd4]" />
                <input
                  id={`ja-mapa-periodo-${microcuenca}`}
                  type="month"
                  value={mesPeriodo}
                  onChange={(e) => setMesPeriodo(e.target.value)}
                  className={cn(
                    "h-10 w-full rounded-lg bg-white pl-10 pr-3 text-sm font-semibold text-zinc-900 outline-none dark:bg-zinc-900 dark:text-zinc-100",
                    modalFieldClass,
                    "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
                  )}
                />
              </div>
              <p className="mt-1.5 text-center text-xs font-medium capitalize text-zinc-500 dark:text-zinc-400">
                {periodoLabel}
              </p>
              <dl className="mt-4 grid grid-cols-4 gap-2">
                {[
                  ["Incidentes", datos.incidentes.length],
                  ["Diálogo", datos.sesiones.length],
                  ["Acuerdos", datos.acuerdos.length],
                  ["Pilotos", datos.proyectos.length],
                ].map(([label, valor]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-zinc-50 px-2 py-2 text-center dark:bg-zinc-800"
                  >
                    <dt className="text-[9px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {label}
                    </dt>
                    <dd className="font-mono text-base font-black text-[#2c5f9b] dark:text-[#6f9fd4]">
                      {valor}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Población afectada en el periodo:{" "}
                <span className="font-mono font-black text-zinc-900 dark:text-zinc-100">
                  {datos.poblacion}
                </span>
              </p>
            </div>
          </div>
        </header>

        <SeccionLista
          titulo="Procesos"
          total={datos.procesos.length}
          vacio="Sin PDF de proceso en este periodo."
          action={
            puede(rol, "procesos.crear") ? (
              <SigetActionButton
                label="Proceso"
                accentColor={sigetAccent.crear}
                morphFrom={Plus}
                morphTo={FileText}
                onClick={() => setCrearProceso(true)}
                ariaLabel="Documentar proceso con PDF"
                className="w-auto shrink-0"
              />
            ) : null
          }
        >
          {datos.procesos.map((row) => (
            <ItemTarjeta
              key={row.id}
              titulo={row.titulo}
              subtitulo={row.resumen}
              fecha={formatFechaCompactaGt(row.fecha)}
              action={
                <>
                  <SigetActionButton
                    label="Abrir"
                    accentColor={sigetAccent.abrir}
                    morphFrom={FileText}
                    morphTo={FileText}
                    onClick={() => window.open(row.pdf_data, "_blank", "noopener,noreferrer")}
                    ariaLabel={`Abrir PDF ${row.nombre_archivo}`}
                    className="w-auto shrink-0"
                  />
                  {puede(rol, "procesos.quitar") ? (
                    <SigetActionButton
                      label="Quitar"
                      accentColor={sigetAccent.quitar}
                      morphFrom={Trash2}
                      morphTo={Trash2}
                      onClick={async () => {
                        const res = await quitarProceso.mutateAsync(row.id);
                        if (res.success) {
                          toast.success("Proceso retirado.");
                          return;
                        }
                        toast.error("No se pudo quitar el proceso.");
                      }}
                      ariaLabel={`Quitar proceso ${row.titulo}`}
                      className="w-auto shrink-0"
                    />
                  ) : null}
                </>
              }
            />
          ))}
        </SeccionLista>

        <SeccionLista
          titulo="Alertas"
          total={datos.incidentes.length}
          vacio="Sin conflictividades en este periodo."
        >
          {datos.incidentes.map((row) => (
            <ItemTarjeta
              key={row.id}
              titulo={row.confidencial ? (row.id_anonimo ?? row.folio) : row.folio}
              subtitulo={row.tipologia}
              fecha={formatFechaCompactaGt(row.fecha)}
              badge={<SemaforoBadge criticidad={row.criticidad} />}
            />
          ))}
        </SeccionLista>

        <SeccionLista
          titulo="Mesas de diálogo"
          total={datos.sesiones.length}
          vacio="Sin sesiones en este periodo."
        >
          {datos.sesiones.map((row) => (
            <ItemTarjeta
              key={row.id}
              titulo={row.titulo}
              subtitulo={etiquetaFase(row.fase)}
              fecha={formatFechaCompactaGt(row.fecha)}
            />
          ))}
        </SeccionLista>

        <SeccionLista
          titulo="Acuerdos"
          total={datos.acuerdos.length}
          vacio="Sin acuerdos en este periodo."
        >
          {datos.acuerdos.map((row) => (
            <ItemTarjeta
              key={row.id}
              titulo={row.descripcion}
              subtitulo={`${row.institucion_responsable} · ${etiquetaAcuerdo(row.estado)}`}
              fecha={formatFechaCompactaGt(row.fecha_limite)}
            />
          ))}
        </SeccionLista>

        <SeccionLista
          titulo="Proyectos piloto"
          total={datos.proyectos.length}
          vacio="Sin pilotos registrados en este periodo."
        >
          {datos.proyectos.map((row) => (
            <ItemTarjeta
              key={row.id}
              titulo={row.nombre}
              subtitulo={`${row.agencia} · ${row.comunidad} · Avance ${row.avance_fisico}%`}
            />
          ))}
        </SeccionLista>

        <SeccionLista
          titulo="Saberes"
          total={datos.metodologias.length}
          vacio="Sin metodologías vinculadas."
        >
          {datos.metodologias.map((row) => (
            <ItemTarjeta
              key={row.id}
              titulo={row.titulo}
              subtitulo={`${row.tipo} · ${row.pertinencia}`}
            />
          ))}
        </SeccionLista>

        <SeccionLista
          titulo="Organizaciones"
          total={datos.organizaciones.length}
          vacio="Sin organizaciones en el municipio."
        >
          {datos.organizaciones.map((row) => (
            <ItemTarjeta
              key={row.id}
              titulo={row.nombre}
              subtitulo={`${row.tipo} · ${row.contacto}`}
            />
          ))}
        </SeccionLista>
      </div>
      <CrearProceso
        open={crearProceso}
        onOpenChange={setCrearProceso}
        microcuenca={microcuenca}
      />
    </motion.aside>
  );
}
