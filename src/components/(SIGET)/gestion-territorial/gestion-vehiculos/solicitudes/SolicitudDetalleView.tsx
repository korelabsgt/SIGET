"use client";

import {
  ArrowLeft,
  CalendarClock,
  Car,
  CarFront,
  Check,
  ChevronLeft,
  CircleCheck,
  CirclePlay,
  CircleStop,
  CircleX,
  Clock,
  Mail,
  MapPin,
  Play,
  Route,
  Square,
  Timer,
  User,
  Users,
  X,
} from "lucide";
import { Loader2 } from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaHoraGt } from "@/lib/fechas-gt";
import { type SolicitudRow } from "./lib/zod";
import { estadoBadgeClass, formatDuracionMision, formatEstadoLabel } from "./lib/helpers";
import { cn } from "@/lib/utils";
import {
  GV_DETALLE_CARD_CLASS,
  GV_DETALLE_CHIP_CLASS,
  GV_DETALLE_NESTED_CLASS,
} from "../lib/detalle-ui";
import { GV_DETAIL_ROUND_ACTION_CLASS } from "../lib/gv-header-ui";

function tituloEstado(estado: SolicitudRow["estado"]) {
  return formatEstadoLabel(estado)
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function ChipDato({
  icon,
  hoverIcon,
  label,
  value,
}: {
  icon: typeof MapPin;
  hoverIcon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div
      className={GV_DETALLE_CHIP_CLASS}
      data-morph-hover-scope
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-celeste-trifinio dark:bg-sky-950">
        <GvMorphIcon icon={icon} hoverIcon={hoverIcon} size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FilaDocumento({
  icon,
  hoverIcon,
  label,
  value,
}: {
  icon: typeof MapPin;
  hoverIcon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border-t border-zinc-200 py-4 first:border-t-0 first:pt-0 dark:border-zinc-700">
      <span className="mt-0.5 text-zinc-400 dark:text-zinc-500">
        <GvMorphIcon icon={icon} hoverIcon={hoverIcon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FilaSimple({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-zinc-300 py-3 first:border-t-0 first:pt-0 dark:border-zinc-800">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-right text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function SolicitudDetalleView({
  solicitud,
  canManage,
  misionPendiente = false,
  onBack,
  onAction,
}: {
  solicitud: SolicitudRow;
  canManage: boolean;
  misionPendiente?: boolean;
  onBack: () => void;
  onAction: (solicitud: SolicitudRow, action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR") => void;
}) {
  const pasajeros = solicitud.pasajeros?.trim() || "Ninguno registrado";
  const ruta = solicitud.ruta_planificada?.trim() || "No especificada";
  const nombreSolicitante = solicitud.solicitante?.nombre?.trim() || "Desconocido";
  const placa = solicitud.vehiculo?.placa ?? "Sin asignar";

  const acciones = (() => {
    if (!canManage) return null;
    if (solicitud.estado === "PENDIENTE") {
      return (
        <>
          <button
            type="button"
            onClick={() => onAction(solicitud, "APROBAR")}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-emerald-600 px-4 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90"
          >
            <GvMorphIcon icon={Check} hoverIcon={CircleCheck} size={14} />
            Aprobar
          </button>
          <button
            type="button"
            onClick={() => onAction(solicitud, "RECHAZAR")}
            className={GV_DETAIL_ROUND_ACTION_CLASS}
            >
            <GvMorphIcon icon={X} hoverIcon={CircleX} size={14} />
            Rechazar
          </button>
        </>
      );
    }
    if (solicitud.estado === "APROBADA") {
      return (
        <button
          type="button"
          disabled={misionPendiente}
          onClick={() => onAction(solicitud, "INICIAR")}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-sky-600 px-4 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {misionPendiente ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <GvMorphIcon icon={Play} hoverIcon={CirclePlay} size={14} />
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
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-violet-600 px-4 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {misionPendiente ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <GvMorphIcon icon={Square} hoverIcon={CircleStop} size={14} />
          )}
          Finalizar misión
        </button>
      );
    }
    return null;
  })();

  return (
    <div className="pb-8 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-9 w-fit cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-0 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:opacity-80 dark:text-zinc-400"
      >
        <GvMorphIcon icon={ArrowLeft} hoverIcon={ChevronLeft} size={16} className="text-current" />
        Regresar
      </button>

      <div className={cn("mt-4", GV_DETALLE_CARD_CLASS)}>
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
                  Creada el {formatFechaHoraGt(solicitud.created_at)}
                </span>
              </div>
              <h1 className="mt-3 flex items-start gap-2.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
                <span className="mt-1 shrink-0 text-celeste-trifinio">
                  <GvMorphIcon icon={MapPin} size={28} morphOnHover={false} />
                </span>
                <span className="min-w-0 capitalize">{solicitud.destino}</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">Solicitado por {nombreSolicitante}</p>
            </div>
            {acciones ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div>
            ) : null}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <ChipDato
              icon={CalendarClock}
              hoverIcon={Clock}
              label="Salida"
              value={formatFechaHoraGt(solicitud.fecha_inicio)}
            />
            <ChipDato
              icon={CalendarClock}
              hoverIcon={Clock}
              label="Retorno"
              value={formatFechaHoraGt(solicitud.fecha_fin_estimada)}
            />
            <ChipDato
              icon={Timer}
              hoverIcon={Clock}
              label="Duración estimada"
              value={formatDuracionMision(solicitud.fecha_inicio, solicitud.fecha_fin_estimada)}
            />
            <ChipDato icon={Car} hoverIcon={CarFront} label="Vehículo" value={placa} />
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
              <p className="mt-2 max-w-prose text-[15px] leading-7 text-foreground">
                {solicitud.justificacion}
              </p>
            </div>
            <div className="mt-6">
              <FilaDocumento icon={Route} hoverIcon={MapPin} label="Ruta planificada" value={ruta} />
              <FilaDocumento icon={Users} hoverIcon={User} label="Pasajeros" value={pasajeros} />
              <FilaDocumento
                icon={User}
                hoverIcon={Mail}
                label="Solicitante"
                value={`${nombreSolicitante}${solicitud.solicitante?.email ? ` · ${solicitud.solicitante.email}` : ""}`}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
              Vehículo asignado
            </h2>
            <div className={cn("mt-4", GV_DETALLE_NESTED_CLASS)} data-morph-hover-scope>
              {solicitud.vehiculo ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-celeste-trifinio text-white">
                      <GvMorphIcon icon={Car} hoverIcon={CarFront} size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black uppercase tracking-wide text-foreground">
                        {solicitud.vehiculo.placa}
                      </p>
                      <p className="truncate text-sm capitalize text-muted-foreground">
                        {solicitud.vehiculo.marca} {solicitud.vehiculo.modelo}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <FilaSimple label="Color" value={solicitud.vehiculo.color?.trim() || "—"} />
                    <FilaSimple
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
    </div>
  );
}
