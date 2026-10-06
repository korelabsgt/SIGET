"use client";

import { ArrowRight, Eye } from "lucide";
import { CalendarRange } from "lucide-react";
import { GvSigetActionButton, sigetAccent } from "../lib/gv-siget-action-button";
import { type SolicitudRow } from "./lib/zod";
import {
  GestionVehiculosTable,
  GestionVehiculosTableEmpty,
  GestionVehiculosThead,
  GestionVehiculosActionCell,
  gvTableActionTdClass,
  gvTableActionThClass,
  gvTableBodyTdClass,
} from "../lib/table-ui";
import { GvTableMorphRow } from "../lib/gv-table-morph-row";
import { cn } from "@/lib/utils";
import { textoSalidaMision } from "./lib/helpers";
import { estadoBadgeClass, formatEstadoLabel } from "./lib/helpers";

function SolicitudListRow({
  solicitud,
  onDetail,
}: {
  solicitud: SolicitudRow;
  onDetail: (solicitud: SolicitudRow) => void;
}) {
  return (
    <GvTableMorphRow>
      <td className={gvTableBodyTdClass}>
        <div className="min-w-0 max-w-full text-center">
          <p className="truncate font-semibold text-foreground">
            {solicitud.solicitante?.nombre || "Desconocido"}
          </p>
          {solicitud.solicitante?.email ? (
            <p className="truncate text-xs text-muted-foreground">{solicitud.solicitante.email}</p>
          ) : null}
        </div>
      </td>
      <td className={gvTableBodyTdClass}>
        <p className="text-sm font-bold tabular-nums text-foreground">
          {textoSalidaMision(solicitud)}
        </p>
      </td>
      <td className={cn(gvTableBodyTdClass, "whitespace-nowrap")}>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoBadgeClass(solicitud.estado)}`}
        >
          {formatEstadoLabel(solicitud.estado)}
        </span>
      </td>
      <td className={gvTableBodyTdClass}>
        {solicitud.vehiculo ? (
          <div className="min-w-0 max-w-full text-center">
            <p className="truncate text-sm font-semibold text-foreground">
              {solicitud.vehiculo.marca} {solicitud.vehiculo.modelo}
            </p>
            <p className="truncate text-xs text-muted-foreground">{solicitud.vehiculo.placa}</p>
          </div>
        ) : (
          <span className="text-xs italic text-muted-foreground">Sin asignar</span>
        )}
      </td>
      <td className={gvTableActionTdClass}>
        <GestionVehiculosActionCell>
          <GvSigetActionButton
            label="Ver"
            accentColor={sigetAccent.abrir}
            morphFrom={Eye}
            morphTo={ArrowRight}
            onClick={() => onDetail(solicitud)}
            ariaLabel={`Ver solicitud a ${solicitud.destino}`}
            className="w-auto shrink-0"
          />
        </GestionVehiculosActionCell>
      </td>
    </GvTableMorphRow>
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
    <GestionVehiculosTable>
      <GestionVehiculosThead
        cells={[
          { key: "solicitante", label: "Solicitante" },
          { key: "salida", label: "Fecha de salida" },
          { key: "estado", label: "Estado" },
          { key: "vehiculo", label: "Vehículo" },
          { key: "acciones", label: "Acciones", className: gvTableActionThClass },
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
