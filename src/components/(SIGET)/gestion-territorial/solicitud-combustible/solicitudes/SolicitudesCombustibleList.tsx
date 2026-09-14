"use client";

import { Fuel } from "lucide-react";
import { Ban, Check } from "lucide";

import {
  GestionVehiculosTable,
  GestionVehiculosTableEmpty,
  GestionVehiculosThead,
  GestionVehiculosActionCell,
  gvTableActionTdClass,
  gvTableActionThClass,
} from "../../gestion-vehiculos/lib/table-ui";
import { GvTableMorphRow } from "../../gestion-vehiculos/lib/gv-table-morph-row";
import { GvSigetActionButton, sigetAccent } from "../../gestion-vehiculos/lib/gv-siget-action-button";

import type { SolicitudCombustibleRow } from "./lib/zod";
import {
  estadoBadgeClassCombustible,
  formatCuponesAsignados,
  formatEstadoSolicitudCombustible,
  formatFechaSolicitudCombustible,
  formatSolicitanteNombre,
  formatVehiculoSolicitudCombustible,
} from "./lib/helpers";

function SolicitudCombustibleRowItem({
  row,
  canResolver,
  onResolver,
}: {
  row: SolicitudCombustibleRow;
  canResolver: boolean;
  onResolver: (row: SolicitudCombustibleRow, accion: "APROBAR" | "RECHAZAR") => void;
}) {
  const pendiente = row.estado === "PENDIENTE";

  return (
    <GvTableMorphRow>
      <td className="px-4 py-3 align-middle text-sm tabular-nums">
        {formatFechaSolicitudCombustible(row.fecha_solicitud)}
      </td>
      <td className="px-4 py-3 align-middle text-sm font-semibold">
        {formatVehiculoSolicitudCombustible(row)}
      </td>
      <td className="px-4 py-3 align-middle text-sm">{formatSolicitanteNombre(row)}</td>
      <td className="whitespace-nowrap px-4 py-3 align-middle">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoBadgeClassCombustible(row.estado)}`}
        >
          {formatEstadoSolicitudCombustible(row.estado)}
        </span>
      </td>
      <td className="px-4 py-3 align-middle text-sm tabular-nums">
        {formatCuponesAsignados(row)}
      </td>
      {canResolver ? (
        <td className={gvTableActionTdClass}>
          {pendiente ? (
            <GestionVehiculosActionCell>
              <GvSigetActionButton
                label="Aprobar"
                accentColor={sigetAccent.guardar}
                morphFrom={Check}
                morphTo={Check}
                onClick={() => onResolver(row, "APROBAR")}
                ariaLabel="Aprobar solicitud"
                className="w-auto shrink-0"
              />
              <GvSigetActionButton
                label="Rechazar"
                accentColor={sigetAccent.quitar}
                morphFrom={Ban}
                morphTo={Ban}
                onClick={() => onResolver(row, "RECHAZAR")}
                ariaLabel="Rechazar solicitud"
                className="w-auto shrink-0"
              />
            </GestionVehiculosActionCell>
          ) : null}
        </td>
      ) : null}
    </GvTableMorphRow>
  );
}

export function SolicitudesCombustibleList({
  solicitudes,
  canResolver,
  onResolver,
}: {
  solicitudes: SolicitudCombustibleRow[];
  canResolver: boolean;
  onResolver: (row: SolicitudCombustibleRow, accion: "APROBAR" | "RECHAZAR") => void;
}) {
  if (solicitudes.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<Fuel className="size-10" strokeWidth={1.75} />}
        title="Sin solicitudes"
        description="Aún no hay solicitudes de combustible registradas."
      />
    );
  }

  return (
    <GestionVehiculosTable>
      <GestionVehiculosThead
        cells={[
          { key: "fecha", label: "Fecha" },
          { key: "vehiculo", label: "Vehículo" },
          { key: "solicitante", label: "Solicitante" },
          { key: "estado", label: "Estado" },
          { key: "cupones", label: "Cupones" },
          ...(canResolver
            ? [{ key: "acciones", label: "Acciones", className: gvTableActionThClass }]
            : []),
        ]}
      />
      <tbody>
        {solicitudes.map((row) => (
          <SolicitudCombustibleRowItem
            key={row.id}
            row={row}
            canResolver={canResolver}
            onResolver={onResolver}
          />
        ))}
      </tbody>
    </GestionVehiculosTable>
  );
}
