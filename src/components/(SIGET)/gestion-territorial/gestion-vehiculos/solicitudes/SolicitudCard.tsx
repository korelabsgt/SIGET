"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarRange,
  Car,
  CarFront,
  Clock,
  MapPin,
  Play,
} from "lucide";
import { type SolicitudRow } from "./lib/zod";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaTablaGt, formatHoraTablaGt } from "@/lib/fechas-gt";
import { estadoBadgeClass, formatEstadoLabel } from "./lib/helpers";

export function SolicitudCard({
  solicitud,
  onDetail,
}: {
  solicitud: SolicitudRow;
  onDetail: (solicitud: SolicitudRow) => void;
}) {
  const [hover, setHover] = useState(false);
  const vehiculo = solicitud.vehiculo;

  return (
    <div
      className="flex flex-col rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
      data-morph-hover-scope
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-foreground">
            {solicitud.solicitante?.nombre || "Desconocido"}
          </p>
          {solicitud.solicitante?.email ? (
            <p className="truncate text-xs text-muted-foreground">{solicitud.solicitante.email}</p>
          ) : null}
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoBadgeClass(solicitud.estado)}`}
        >
          {formatEstadoLabel(solicitud.estado)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 text-celeste-trifinio">
            <GvMorphIcon icon={MapPin} hoverIcon={MapPin} size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Destino
            </p>
            <p className="truncate text-sm font-semibold text-foreground">{solicitud.destino}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 text-celeste-trifinio">
              <GvMorphIcon icon={CalendarRange} hoverIcon={Clock} size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Salida
              </p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatFechaTablaGt(solicitud.fecha_inicio)}
              </p>
              <p className="text-xs font-semibold tabular-nums text-celeste-trifinio">
                {formatHoraTablaGt(solicitud.fecha_inicio)}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 text-celeste-trifinio">
              <GvMorphIcon icon={Car} hoverIcon={CarFront} size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Vehículo
              </p>
              {vehiculo ? (
                <>
                  <p className="truncate text-sm font-semibold text-foreground">{vehiculo.placa}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {vehiculo.marca} {vehiculo.modelo}
                  </p>
                </>
              ) : (
                <p className="text-sm italic text-muted-foreground">Sin asignar</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => onDetail(solicitud)}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-celeste-trifinio px-3.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          aria-label={`Ejecutar solicitud a ${solicitud.destino}`}
        >
          <GvMorphIcon
            icon={Play}
            hoverIcon={ArrowRight}
            size={14}
            externalHover={hover}
          />
          Ejecutar
        </button>
      </div>
    </div>
  );
}
