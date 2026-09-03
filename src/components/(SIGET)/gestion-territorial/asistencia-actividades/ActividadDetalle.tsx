"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, SquarePen } from "lucide";
import { ChevronLeft, Loader2, Calendar, MapPin } from "lucide-react";
import { useActividad, useEditarActividad, useMinutaBorrador, useRegistrosActividad } from "./lib/hooks";
import { rutaDetalleActividadAsistencia, slugActividadDesdeRecord } from "./lib/helpers";
import {
  actividadFormSchema,
  formatFechaActividad,
  formatUbicacionActividad,
  normalizarFechaInput,
} from "./lib/zod";
import {
  statsEdadPorGenero,
  statsPorGenero,
  statsPorInstitucion,
} from "./lib/stats";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { QrActividad } from "./QrActividad";
import { GraficasAsistencia } from "./GraficasAsistencia";
import { TablaRegistros } from "./TablaRegistros";
import { VerEditarActividad } from "./forms/VerEditar";
import { Minuta } from "./Minuta";
import { MinutaEditor } from "./forms/MinutaEditor";
import { saveVistaMinuta, loadVistaMinuta } from "./lib/minuta";

export function ActividadDetalle({ actividadRef }: { actividadRef: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: actividad, isLoading: loadingAct } = useActividad(actividadRef);
  const {
    minuta,
    setMinuta,
    listo: minutaListo,
    guardarMinuta,
    guardando: minutaGuardando,
  } = useMinutaBorrador(actividad ?? undefined);
  const { data: registros = [], isLoading: loadingReg } =
    useRegistrosActividad(actividadRef, !!actividadRef);
  const editar = useEditarActividad();
  const [editarOpen, setEditarOpen] = useState(false);
  const [vistaMinuta, setVistaMinuta] = useState(false);
  const [activoObjetivo, setActivoObjetivo] = useState<boolean | null>(null);
  const [guardandoActivo, setGuardandoActivo] = useState(false);

  const abrirMinuta = () => {
    if (actividad) saveVistaMinuta(actividad.id, true);
    setVistaMinuta(true);
  };

  const cerrarMinuta = () => {
    guardarMinuta();
    if (actividad) saveVistaMinuta(actividad.id, false);
    setVistaMinuta(false);
  };

  useEffect(() => {
    if (!actividad?.id) return;
    setVistaMinuta(loadVistaMinuta(actividad.id));
  }, [actividad?.id]);

  useEffect(() => {
    if (actividad?.slug && actividad.slug !== actividadRef) {
      router.replace(rutaDetalleActividadAsistencia(actividad));
    }
  }, [actividad, actividadRef, router]);

  useEffect(() => {
    if (activoObjetivo === null || !actividad) return;
    if (actividad.activo === activoObjetivo) {
      setActivoObjetivo(null);
      setGuardandoActivo(false);
    }
  }, [actividad?.activo, activoObjetivo, actividad]);

  const porGenero = useMemo(() => statsPorGenero(registros), [registros]);
  const edadPorGenero = useMemo(
    () => statsEdadPorGenero(registros),
    [registros],
  );
  const porInstitucion = useMemo(
    () => statsPorInstitucion(registros),
    [registros],
  );

  const handleActivoChange = async (checked: boolean) => {
    if (!actividad || guardandoActivo) return;
    if (checked === actividad.activo) return;

    setActivoObjetivo(checked);
    setGuardandoActivo(true);

    const parsed = actividadFormSchema.safeParse({
      nombre: actividad.nombre,
      descripcion: actividad.descripcion ?? "",
      fecha_realizacion: normalizarFechaInput(actividad.fecha_realizacion),
      direccion: actividad.direccion ?? "",
      departamento: actividad.departamento ?? "",
      municipio: actividad.municipio ?? "",
      activo: checked,
    });

    if (!parsed.success) {
      setActivoObjetivo(null);
      setGuardandoActivo(false);
      return;
    }

    try {
      const res = await editar.mutateAsync({
        id: actividad.id,
        values: parsed.data,
      });
      if (!res.success) {
        setActivoObjetivo(null);
        setGuardandoActivo(false);
        return;
      }
      qc.setQueryData(
        ["asist-actividades", actividadRef],
        (prev: typeof actividad | undefined) =>
          prev ? { ...prev, activo: checked } : prev,
      );
    } catch {
      setActivoObjetivo(null);
      setGuardandoActivo(false);
    }
  };

  if (loadingAct) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    );
  }

  if (!actividad) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-foreground">
          Actividad no encontrada
        </p>
        <Link
          href="/siget/gestion-territorial/asistencia-actividades"
          className="mt-4 inline-flex cursor-pointer text-sm font-bold text-azul-trifinio hover:underline"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  const activoConfirmado = actividad.activo;

  if (vistaMinuta) {
    return (
      <div className="w-full overflow-x-hidden px-2 pb-8 sm:px-3 lg:px-4">
        <div className="flex items-center py-2.5">
          <button
            type="button"
            onClick={cerrarMinuta}
            className="inline-flex cursor-pointer items-center gap-0.5 text-sm font-bold text-azul-trifinio hover:underline"
          >
            <ChevronLeft className="size-4 shrink-0" strokeWidth={2.25} />
            <span className="translate-y-px">Volver a actividad</span>
          </button>
        </div>

        <MinutaEditor
          minuta={minuta}
          setMinuta={setMinuta}
          listo={minutaListo}
          guardando={minutaGuardando}
          onSave={(estado) => {
            guardarMinuta(estado);
            cerrarMinuta();
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden px-2 pb-8 pt-1 sm:px-3 lg:px-4">
      <Link
        href="/siget/gestion-territorial/asistencia-actividades"
        className="mb-4 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-azul-trifinio hover:underline"
      >
        <ChevronLeft className="size-4" />
        Volver a actividades
      </Link>

      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900">
        <div className="bg-celeste-trifinio pt-1">
          <div className="overflow-hidden rounded-t-2xl bg-card dark:bg-zinc-900">
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Detalle de actividad
                </p>
                <h1 className="truncate text-lg font-black leading-tight text-foreground sm:text-xl">
                  {actividad.nombre}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold capitalize text-celeste-trifinio">
                    <Calendar className="size-3.5 shrink-0" />
                    {formatFechaActividad(actividad.fecha_realizacion)}
                  </span>
                  {(actividad.direccion || actividad.departamento) && (
                    <span className="inline-flex min-w-0 max-w-full items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0 text-celeste-trifinio/80" />
                      <span className="truncate">
                        {formatUbicacionActividad(actividad)}
                      </span>
                    </span>
                  )}
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    {registros.length} registros
                  </span>
                </div>
                {actividad.descripcion ? (
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {actividad.descripcion}
                  </p>
                ) : null}
              </div>
              <SigetActionButton
                label="Editar"
                accentColor={sigetAccent.editar}
                morphFrom={Pencil}
                morphTo={SquarePen}
                onClick={() => setEditarOpen(true)}
                ariaLabel="Editar actividad"
                className="w-auto shrink-0 self-start"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="flex min-h-[420px] w-full min-w-0 flex-col rounded-3xl border border-slate-200/70 bg-white p-6 dark:border-zinc-800 dark:bg-card lg:basis-[34%] lg:shrink-0">
            <QrActividad
              actividadSlug={slugActividadDesdeRecord(actividad)}
              nombreActividad={actividad.nombre}
              activo={activoConfirmado}
              activoPending={guardandoActivo}
              onActivoChange={handleActivoChange}
            />
          </div>

          <div className="flex min-h-[420px] min-w-0 flex-col rounded-3xl border border-slate-200/70 bg-white p-6 dark:border-zinc-800 dark:bg-card lg:min-w-0 lg:basis-[66%]">
            <Minuta
              minuta={minuta}
              listo={minutaListo}
              onAbrir={abrirMinuta}
            />
          </div>
        </div>

        <GraficasAsistencia
          porGenero={porGenero}
          porInstitucion={porInstitucion}
          edadPorGenero={edadPorGenero}
        />

        <TablaRegistros
          registros={registros}
          actividadId={actividad.id}
          nombreActividad={actividad.nombre}
          isLoading={loadingReg}
        />
      </div>

      <VerEditarActividad
        open={editarOpen}
        actividad={actividad}
        onClose={() => setEditarOpen(false)}
      />
    </div>
  );
}
