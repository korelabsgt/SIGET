"use client";

import { type ReactNode } from "react";
import {
  ArrowLeft,
  MapPin,
  User,
  Mail,
  CalendarRange,
  Clock,
  Route,
  FileText,
  Users,
  Car,
  CheckCircle,
  XCircle,
  PlayCircle,
  StopCircle,
} from "lucide-react";
import { formatFechaHoraGt } from "@/lib/fechas-gt";
import { type SolicitudRow } from "./lib/zod";
import { estadoBadgeClass, formatDuracionMision, formatEstadoLabel } from "./lib/helpers";
import { cn } from "@/lib/utils";

function SpecItem({
  icon: Icon,
  label,
  value,
  large,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-200/80 text-muted-foreground dark:bg-zinc-700">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p
          className={cn(
            "font-semibold text-foreground",
            large ? "mt-0.5 text-2xl capitalize tracking-tight md:text-3xl" : "mt-1 text-lg",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function InfoCard({
  titulo,
  children,
  className,
}: {
  titulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800",
        className,
      )}
    >
      <p className="mb-5 text-xs font-bold uppercase tracking-widest text-celeste-trifinio">{titulo}</p>
      {children}
    </div>
  );
}

export function SolicitudDetalleView({
  solicitud,
  canManage,
  onBack,
  onAction,
}: {
  solicitud: SolicitudRow;
  canManage: boolean;
  onBack: () => void;
  onAction: (solicitud: SolicitudRow, action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR") => void;
}) {
  const pasajeros = solicitud.pasajeros?.trim() || "Ninguno registrado";
  const ruta = solicitud.ruta_planificada?.trim() || "No especificada";

  const accionesHeader = (() => {
    if (!canManage) return null;
    if (solicitud.estado === "PENDIENTE") {
      return (
        <>
          <button
            type="button"
            onClick={() => onAction(solicitud, "APROBAR")}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-emerald-100 px-4 text-[10px] font-bold uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
          >
            <CheckCircle className="size-4" />
            Aprobar
          </button>
          <button
            type="button"
            onClick={() => onAction(solicitud, "RECHAZAR")}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-red-100 px-4 text-[10px] font-bold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
          >
            <XCircle className="size-4" />
            Rechazar
          </button>
        </>
      );
    }
    if (solicitud.estado === "APROBADA") {
      return (
        <button
          type="button"
          onClick={() => onAction(solicitud, "INICIAR")}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-sky-100 px-4 text-[10px] font-bold uppercase tracking-wider text-azul-trifinio transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900"
        >
          <PlayCircle className="size-4" />
          Iniciar misión
        </button>
      );
    }
    if (solicitud.estado === "EN_MISION") {
      return (
        <button
          type="button"
          onClick={() => onAction(solicitud, "FINALIZAR")}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-violet-100 px-4 text-[10px] font-bold uppercase tracking-wider text-violet-700 transition-colors hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:hover:bg-violet-900"
        >
          <StopCircle className="size-4" />
          Finalizar misión
        </button>
      );
    }
    return null;
  })();

  return (
    <div className="px-3 pb-6 pt-4 sm:px-5 sm:pt-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-zinc-200 px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Volver a la lista
        </button>
        {accionesHeader ? <div className="flex shrink-0 items-center gap-2">{accionesHeader}</div> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        <InfoCard titulo="Información de la solicitud" className="lg:col-span-6">
          <div className="mb-6 border-b border-border pb-5 dark:border-zinc-700">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoBadgeClass(solicitud.estado)}`}
              >
                {formatEstadoLabel(solicitud.estado)}
              </span>
              <span className="text-xs text-muted-foreground">
                Creada el {formatFechaHoraGt(solicitud.created_at)}
              </span>
            </div>
            <SpecItem icon={MapPin} label="Destino" value={solicitud.destino} large />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SpecItem
              icon={User}
              label="Solicitante"
              value={solicitud.solicitante?.nombre || "Desconocido"}
            />
            <SpecItem icon={Mail} label="Correo" value={solicitud.solicitante?.email || "—"} />
          </div>
        </InfoCard>

        <InfoCard titulo="Programación del viaje" className="lg:col-span-6">
          <div className="grid grid-cols-1 gap-6">
            <SpecItem
              icon={CalendarRange}
              label="Salida"
              value={formatFechaHoraGt(solicitud.fecha_inicio)}
            />
            <SpecItem
              icon={CalendarRange}
              label="Retorno estimado"
              value={formatFechaHoraGt(solicitud.fecha_fin_estimada)}
            />
            <SpecItem
              icon={Clock}
              label="Duración estimada"
              value={formatDuracionMision(solicitud.fecha_inicio, solicitud.fecha_fin_estimada)}
            />
          </div>
        </InfoCard>

        <InfoCard titulo="Detalle de la misión" className="lg:col-span-6">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Justificación
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{solicitud.justificacion}</p>
            </div>
            <SpecItem icon={Route} label="Ruta planificada" value={ruta} />
            <SpecItem icon={Users} label="Pasajeros" value={pasajeros} />
          </div>
        </InfoCard>

        <InfoCard titulo="Vehículo asignado" className="lg:col-span-6">
          {solicitud.vehiculo ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <SpecItem icon={Car} label="Placa" value={solicitud.vehiculo.placa} large />
              <SpecItem
                icon={Car}
                label="Marca / modelo"
                value={`${solicitud.vehiculo.marca} ${solicitud.vehiculo.modelo}`}
              />
              {solicitud.vehiculo.color ? (
                <SpecItem icon={FileText} label="Color" value={solicitud.vehiculo.color} />
              ) : null}
              {solicitud.vehiculo.kilometraje_actual != null ? (
                <SpecItem
                  icon={Clock}
                  label="Odómetro"
                  value={`${solicitud.vehiculo.kilometraje_actual.toLocaleString()} km`}
                />
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-zinc-100/80 px-4 py-8 text-center dark:bg-zinc-900/40">
              <Car className="mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">Sin vehículo asignado</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Se asignará al aprobar la solicitud.
              </p>
            </div>
          )}
        </InfoCard>
      </div>
    </div>
  );
}
