"use client";

import { useState } from "react";
import { ArrowRight, Play } from "lucide";
import { CalendarRange } from "lucide-react";
import { type SolicitudRow } from "./lib/zod";
import {
  GestionVehiculosTable,
  GestionVehiculosTableEmpty,
  GestionVehiculosThead,
} from "../lib/table-ui";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaTablaGt, formatHoraTablaGt } from "@/lib/fechas-gt";
import { estadoBadgeClass, formatEstadoLabel } from "./lib/helpers";

function SolicitudListRow({
  solicitud,
  onDetail,
}: {
  solicitud: SolicitudRow;
  onDetail: (solicitud: SolicitudRow) => void;
}) {
  const [rowHover, setRowHover] = useState(false);

  return (
    <tr
      className="border-b border-border last:border-0 transition-colors hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20"
      onMouseEnter={() => setRowHover(true)}
      onMouseLeave={() => setRowHover(false)}
    >
      <td className="px-4 py-3 align-middle">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {solicitud.solicitante?.nombre || "Desconocido"}
          </p>
          {solicitud.solicitante?.email ? (
            <p className="truncate text-xs text-muted-foreground">{solicitud.solicitante.email}</p>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="tabular-nums">
          <p className="text-sm font-bold text-foreground">
            {formatFechaTablaGt(solicitud.fecha_inicio)}
          </p>
          <p className="text-sm font-semibold text-celeste-trifinio">
            {formatHoraTablaGt(solicitud.fecha_inicio)}
          </p>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoBadgeClass(solicitud.estado)}`}
        >
          {formatEstadoLabel(solicitud.estado)}
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        {solicitud.vehiculo ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {solicitud.vehiculo.marca} {solicitud.vehiculo.modelo}
            </p>
            <p className="truncate text-xs text-muted-foreground">{solicitud.vehiculo.placa}</p>
          </div>
        ) : (
          <span className="text-xs italic text-muted-foreground">Sin asignar</span>
        )}
      </td>
      <td className="px-4 py-3 text-center align-middle">
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
            externalHover={rowHover}
          />
          Ejecutar
        </button>
      </td>
    </tr>
  );
}

export function SolicitudesList({
  solicitudes,
  onDetail,
}: {
  solicitudes: SolicitudRow[];
  onDetail: (solicitud: SolicitudRow) => void;
}) {
  if (solicitudes.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<CalendarRange className="size-10" />}
        title="Sin solicitudes"
        description="No se encontraron solicitudes en este filtro."
      />
    );
  }

  return (
    <GestionVehiculosTable minWidth={900}>
      <GestionVehiculosThead
        cells={[
          { key: "solicitante", label: "Solicitante" },
          { key: "salida", label: "Fecha de salida" },
          { key: "estado", label: "Estado" },
          { key: "vehiculo", label: "Vehículo" },
          { key: "acciones", label: "Acciones", className: "text-center" },
        ]}
      />
      <tbody>
        {solicitudes.map((sol) => (
          <SolicitudListRow key={sol.id} solicitud={sol} onDetail={onDetail} />
        ))}
      </tbody>
    </GestionVehiculosTable>
  );
}
