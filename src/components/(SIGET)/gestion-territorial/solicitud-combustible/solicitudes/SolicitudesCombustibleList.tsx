"use client";

import { Fuel } from "lucide-react";
import { ArrowRight, Eye } from "lucide";

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
  formatMisionVinculadaCombustible,
} from "./lib/helpers";

function SolicitudCombustibleRowItem({
  row,
  onDetail,
}: {
  row: SolicitudCombustibleRow;
  onDetail: (row: SolicitudCombustibleRow) => void;
}) {
  const vehiculo = row.vehiculo;
  const mision = formatMisionVinculadaCombustible(row);
  const solicitanteNombre = row.solicitante?.nombre?.trim() || "Desconocido";
  const solicitanteEmail = row.solicitante?.email?.trim();

  return (
    <GvTableMorphRow>
      <td className="px-4 py-3 align-middle">
        <p className="text-sm font-bold tabular-nums text-foreground">
          {formatFechaSolicitudCombustible(row.fecha_solicitud)}
        </p>
      </td>
      <td className="px-4 py-3 align-middle">
        {vehiculo ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {vehiculo.marca} {vehiculo.modelo}
            </p>
            <p className="truncate text-xs text-muted-foreground">{vehiculo.placa}</p>
          </div>
        ) : (
          <span className="text-xs italic text-muted-foreground">Sin vehículo</span>
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{mision === "—" ? "Sin misión" : mision}</p>
          {row.solicitud_vehiculo?.fecha_inicio ? (
            <p className="truncate text-xs text-muted-foreground">
              {formatFechaSolicitudCombustible(row.solicitud_vehiculo.fecha_inicio)}
            </p>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{solicitanteNombre}</p>
          {solicitanteEmail ? (
            <p className="truncate text-xs text-muted-foreground">{solicitanteEmail}</p>
          ) : null}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoBadgeClassCombustible(row.estado)}`}
        >
          {formatEstadoSolicitudCombustible(row.estado)}
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {formatCuponesAsignados(row)}
        </p>
      </td>
      <td className={gvTableActionTdClass}>
        <GestionVehiculosActionCell>
          <GvSigetActionButton
            label="Ver"
            accentColor={sigetAccent.abrir}
            morphFrom={Eye}
            morphTo={ArrowRight}
            onClick={() => onDetail(row)}
            ariaLabel="Ver solicitud de combustible"
            className="w-auto shrink-0"
          />
        </GestionVehiculosActionCell>
      </td>
    </GvTableMorphRow>
  );
}

export function SolicitudesCombustibleList({
  solicitudes,
  onDetail,
}: {
  solicitudes: SolicitudCombustibleRow[];
  onDetail: (row: SolicitudCombustibleRow) => void;
}) {
  if (solicitudes.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<Fuel className="size-10" strokeWidth={1.75} />}
        title="Sin solicitudes"
        description="No se encontraron solicitudes en este filtro."
      />
    );
  }

  return (
    <GestionVehiculosTable>
      <GestionVehiculosThead
        cells={[
          { key: "fecha", label: "Fecha" },
          { key: "vehiculo", label: "Vehículo" },
          { key: "mision", label: "Misión vinculada" },
          { key: "solicitante", label: "Solicitante" },
          { key: "estado", label: "Estado" },
          { key: "cupones", label: "Cupones" },
          { key: "acciones", label: "Acciones", className: gvTableActionThClass },
        ]}
      />
      <tbody>
        {solicitudes.map((row) => (
          <SolicitudCombustibleRowItem key={row.id} row={row} onDetail={onDetail} />
        ))}
      </tbody>
    </GestionVehiculosTable>
  );
}
