"use client";

import { ArrowLeft, ChevronLeft } from "lucide";
import {
  Check,
  Loader2,
  MapPin,
  Play,
  Route,
  Square,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { GvDetalleEncabezadoVehiculo } from "../lib/gv-detalle-modal-ui";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import { type SolicitudRow } from "./lib/zod";
import { estadoBadgeClass, formatDuracionMision, formatEstadoLabel } from "./lib/helpers";
import { cn } from "@/lib/utils";
import { GV_DETALLE_CARD_CLASS } from "../lib/detalle-ui";

function tituloEstado(estado: SolicitudRow["estado"]) {
  return formatEstadoLabel(estado)
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function StatResumen({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-100 px-3 py-3 text-center dark:bg-zinc-800/90">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-bold leading-snug text-foreground">{value}</p>
    </div>
  );
}

function FilaMision({
  icon: Icon,
  label,
  value,
  destacado = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  destacado?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 border-t border-zinc-200 py-4 first:border-t-0 first:pt-0 dark:border-zinc-700/80">
      <span className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-500">
        <Icon size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 text-sm leading-relaxed",
            destacado ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function FilaVehiculoDato({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-zinc-200 py-3 first:border-t-0 first:pt-0 dark:border-zinc-700/80">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-right text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function AccionesSolicitud({
  solicitud,
  canManage,
  misionPendiente,
  onAction,
  anchoCompleto = false,
}: {
  solicitud: SolicitudRow;
  canManage: boolean;
  misionPendiente: boolean;
  onAction: (solicitud: SolicitudRow, action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR") => void;
  anchoCompleto?: boolean;
}) {
  if (!canManage) return null;

  const btnBase = cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-0 text-[11px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
    anchoCompleto ? "h-12 w-full" : "h-9 px-4",
  );

  if (solicitud.estado === "PENDIENTE") {
    return (
      <div className={cn(anchoCompleto && "grid grid-cols-2 gap-3")}>
        <button
          type="button"
          onClick={() => onAction(solicitud, "APROBAR")}
          className={cn(btnBase, "bg-emerald-500 dark:bg-emerald-600")}
        >
          <Check size={16} strokeWidth={2.5} />
          Aprobar
        </button>
        <button
          type="button"
          onClick={() => onAction(solicitud, "RECHAZAR")}
          className={cn(btnBase, "bg-red-600 dark:bg-red-700")}
        >
          <X size={16} strokeWidth={2.5} />
          Rechazar
        </button>
      </div>
    );
  }

  if (solicitud.estado === "APROBADA") {
    return (
      <button
        type="button"
        disabled={misionPendiente}
        onClick={() => onAction(solicitud, "INICIAR")}
        className={cn(btnBase, "bg-sky-600 dark:bg-sky-700", anchoCompleto && "col-span-2")}
      >
        {misionPendiente ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play size={16} strokeWidth={2.5} />
        )}
        Iniciar misión
      </button>
    );
  }

  if (solicitud.estado === "EN_MISION") {
    return (
      <button
        type="button"
        disabled={misionPendiente}
        onClick={() => onAction(solicitud, "FINALIZAR")}
        className={cn(btnBase, "bg-violet-600 dark:bg-violet-700", anchoCompleto && "col-span-2")}
      >
        {misionPendiente ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Square size={16} strokeWidth={2.5} />
        )}
        Finalizar misión
      </button>
    );
  }

  return null;
}

function ContenidoDetalle({
  solicitud,
  canManage,
  misionPendiente,
  onAction,
  embedded,
  onClose,
}: {
  solicitud: SolicitudRow;
  canManage: boolean;
  misionPendiente: boolean;
  onAction: (solicitud: SolicitudRow, action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR") => void;
  embedded: boolean;
  onClose?: () => void;
}) {
  const pasajeros = solicitud.pasajeros?.trim() || "Ninguno registrado";
  const ruta = solicitud.ruta_planificada?.trim() || "No especificada";
  const nombreSolicitante = solicitud.solicitante?.nombre?.trim() || "Desconocido";
  const acciones = (
    <AccionesSolicitud
      solicitud={solicitud}
      canManage={canManage}
      misionPendiente={misionPendiente}
      onAction={onAction}
      anchoCompleto={embedded}
    />
  );

  if (embedded) {
    return (
      <div className="space-y-5 pb-2">
        <div className="relative space-y-1 pr-12">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-0 top-0 flex size-10 cursor-pointer items-center justify-center rounded-full text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10"
              aria-label="Cerrar"
            >
              <X size={22} strokeWidth={2.25} />
            </button>
          ) : null}
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-1 size-6 shrink-0 text-celeste-trifinio" strokeWidth={2.25} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black capitalize tracking-tight text-foreground md:text-[1.65rem]">
                  {solicitud.destino}
                </h1>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    estadoBadgeClass(solicitud.estado),
                  )}
                >
                  {tituloEstado(solicitud.estado)}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Solicitado por {nombreSolicitante} · Creada el {formatFechaHoraGv(solicitud.created_at)}
              </p>
            </div>
          </div>
        </div>

        {acciones ? <div>{acciones}</div> : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatResumen label="Salida" value={formatFechaHoraGv(solicitud.fecha_inicio)} />
          <StatResumen label="Retorno" value={formatFechaHoraGv(solicitud.fecha_fin_estimada)} />
          <StatResumen
            label="Duración"
            value={formatDuracionMision(solicitud.fecha_inicio, solicitud.fecha_fin_estimada)}
          />
        </div>

        <div className="grid gap-8 border-t border-zinc-200 pt-6 dark:border-zinc-700/80 lg:grid-cols-[minmax(0,1.55fr)_minmax(14rem,1fr)] lg:gap-10">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
              Detalle de la misión
            </h2>
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Justificación
              </p>
              <p className="mt-2 text-[15px] font-semibold leading-7 text-foreground">
                {solicitud.justificacion}
              </p>
            </div>
            <div className="mt-2">
              <FilaMision icon={Route} label="Ruta planificada" value={ruta} />
              <FilaMision icon={Users} label="Pasajeros" value={pasajeros} />
              <FilaMision icon={User} label="Solicitante" value={nombreSolicitante} destacado />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
              Vehículo asignado
            </h2>
            <div className="mt-4 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800/90">
              {solicitud.vehiculo ? (
                <>
                  <GvDetalleEncabezadoVehiculo
                    marca={solicitud.vehiculo.marca}
                    modelo={solicitud.vehiculo.modelo}
                    placa={solicitud.vehiculo.placa}
                  />
                  <div className="mt-3">
                    <FilaVehiculoDato label="Color" value={solicitud.vehiculo.color?.trim() || "—"} />
                    <FilaVehiculoDato
                      label="Odómetro"
                      value={
                        solicitud.vehiculo.kilometraje_actual != null
                          ? `${solicitud.vehiculo.kilometraje_actual.toLocaleString("es-GT")} km`
                          : "—"
                      }
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Aún no hay vehículo asignado. Se definirá al aprobar la solicitud.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={GV_DETALLE_CARD_CLASS}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                estadoBadgeClass(solicitud.estado),
              )}
            >
              {tituloEstado(solicitud.estado)}
            </span>
            <span className="text-xs text-muted-foreground">
              Creada el {formatFechaHoraGv(solicitud.created_at)}
            </span>
          </div>
          <h1 className="mt-3 flex items-start gap-2.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            <span className="mt-1 shrink-0 text-celeste-trifinio">
              <MapPin size={28} strokeWidth={2.25} />
            </span>
            <span className="min-w-0 capitalize">{solicitud.destino}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Solicitado por {nombreSolicitante}</p>
        </div>
        {acciones ? <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div> : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatResumen label="Salida" value={formatFechaHoraGv(solicitud.fecha_inicio)} />
        <StatResumen label="Retorno" value={formatFechaHoraGv(solicitud.fecha_fin_estimada)} />
        <StatResumen
          label="Duración"
          value={formatDuracionMision(solicitud.fecha_inicio, solicitud.fecha_fin_estimada)}
        />
      </div>

      <div className="mt-8 grid gap-8 border-t border-border pt-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.9fr)] lg:gap-12 dark:border-zinc-700">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
            Detalle de la misión
          </h2>
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Justificación
            </p>
            <p className="mt-2 max-w-prose text-[15px] leading-7 text-foreground">{solicitud.justificacion}</p>
          </div>
          <div className="mt-2">
            <FilaMision icon={Route} label="Ruta planificada" value={ruta} />
            <FilaMision icon={Users} label="Pasajeros" value={pasajeros} />
            <FilaMision icon={User} label="Solicitante" value={nombreSolicitante} destacado />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
            Vehículo asignado
          </h2>
          <div className="mt-4 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800/90">
            {solicitud.vehiculo ? (
              <>
                <GvDetalleEncabezadoVehiculo
                  marca={solicitud.vehiculo.marca}
                  modelo={solicitud.vehiculo.modelo}
                  placa={solicitud.vehiculo.placa}
                />
                <div className="mt-3">
                  <FilaVehiculoDato label="Color" value={solicitud.vehiculo.color?.trim() || "—"} />
                  <FilaVehiculoDato
                    label="Odómetro"
                    value={
                      solicitud.vehiculo.kilometraje_actual != null
                        ? `${solicitud.vehiculo.kilometraje_actual.toLocaleString("es-GT")} km`
                        : "—"
                    }
                  />
                </div>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Aún no hay vehículo asignado. Se definirá al aprobar la solicitud.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export function SolicitudDetalleView({
  solicitud,
  canManage,
  misionPendiente = false,
  embedded = false,
  onBack,
  onClose,
  onAction,
}: {
  solicitud: SolicitudRow;
  canManage: boolean;
  misionPendiente?: boolean;
  embedded?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onAction: (solicitud: SolicitudRow, action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR") => void;
}) {
  return (
    <div className={embedded ? undefined : "pb-8 pt-1"}>
      {!embedded && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 w-fit cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-0 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:opacity-80 dark:text-zinc-400"
        >
          <GvMorphIcon icon={ArrowLeft} hoverIcon={ChevronLeft} size={16} className="text-current" />
          Regresar
        </button>
      ) : null}

      <div className={cn(!embedded && "mt-4")}>
        <ContenidoDetalle
          solicitud={solicitud}
          canManage={canManage}
          misionPendiente={misionPendiente}
          onAction={onAction}
          embedded={embedded}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
