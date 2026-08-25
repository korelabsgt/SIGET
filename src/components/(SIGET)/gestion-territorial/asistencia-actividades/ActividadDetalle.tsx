"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, SquarePen } from "lucide";
import { ChevronLeft, Loader2, Calendar, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { MorphSwitch } from "@/components/ui/morph-switch";
import { modalActionMessage } from "@/components/ui/general-modal";
import { useActividad, useEditarActividad, useRegistrosActividad } from "./lib/hooks";
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
import { QrActividad } from "./QrActividad";
import { GraficasAsistencia } from "./GraficasAsistencia";
import { TablaRegistros } from "./TablaRegistros";
import { VerEditarActividad } from "./forms/VerEditar";

export function ActividadDetalle({ actividadRef }: { actividadRef: string }) {
  const router = useRouter();
  const { data: actividad, isLoading: loadingAct } = useActividad(actividadRef);
  const { data: registros = [], isLoading: loadingReg } =
    useRegistrosActividad(actividadRef, !!actividadRef);
  const editar = useEditarActividad();
  const [editarOpen, setEditarOpen] = useState(false);

  useEffect(() => {
    if (actividad?.slug && actividad.slug !== actividadRef) {
      router.replace(rutaDetalleActividadAsistencia(actividad));
    }
  }, [actividad, actividadRef, router]);

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
    if (!actividad || editar.isPending) return;
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
      toast.warn("No se pudo cambiar el estado.");
      return;
    }
    const res = await editar.mutateAsync({
      id: actividad.id,
      values: parsed.data,
    });
    if (res.success) {
      toast.success(
        checked ? "Actividad activada." : "Actividad desactivada.",
      );
    } else {
      toast.error(
        modalActionMessage(res.error ?? undefined, "No se pudo actualizar."),
      );
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

  return (
    <div className="w-full overflow-x-hidden px-4 pb-8 pt-1 sm:px-6 lg:px-8">
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
              <button
                type="button"
                onClick={() => setEditarOpen(true)}
                className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-lg border-0 bg-sky-100 px-3 text-xs font-bold text-azul-trifinio transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900"
              >
                <MorphHoverIcon
                  from={Pencil}
                  to={SquarePen}
                  size={15}
                  color="#1a95d3"
                  spring="snappy"
                />
                Editar actividad
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="flex w-full shrink-0 flex-col rounded-3xl border border-slate-200/70 bg-white p-6 dark:border-zinc-800 dark:bg-card lg:w-fit">
            <div className="mb-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Código QR de asistencia
              </p>
              <p className="max-w-xs text-sm font-semibold leading-snug text-foreground">
                {actividad.nombre}
              </p>
            </div>
            <QrActividad
              actividadSlug={slugActividadDesdeRecord(actividad)}
              nombreActividad={actividad.nombre}
              size={220}
              showNombre={false}
            />
            <div className="mt-6 border-t border-slate-200/70 pt-6 dark:border-zinc-800">
              <MorphSwitch
                id="detalle-activo"
                checked={actividad.activo}
                onCheckedChange={handleActivoChange}
                label={actividad.activo ? "Actividad activa" : "Actividad inactiva"}
                description={
                  actividad.activo
                    ? "Acepta registros públicos"
                    : "El formulario público está cerrado"
                }
                variant="plain"
                className="w-full"
                disabled={editar.isPending}
              />
            </div>
          </div>

          <div className="flex min-h-[420px] min-w-0 flex-1 flex-col rounded-3xl border border-slate-200/70 bg-white p-6 dark:border-zinc-800 dark:bg-card">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Minuta de reunión
            </p>
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-zinc-50/60 p-6 dark:border-zinc-700 dark:bg-zinc-800/30">
              <p className="text-center text-sm text-muted-foreground">
                Contenido disponible próximamente.
              </p>
            </div>
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
