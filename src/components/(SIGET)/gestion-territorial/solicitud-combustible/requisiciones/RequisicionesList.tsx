"use client";

import { FileText } from "lucide-react";
import { ArrowDownToLine, FileSpreadsheet } from "lucide";

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

import type { SolicitudCombustibleRow } from "../solicitudes/lib/zod";
import {
  cantidadCuponesSolicitud,
  formatCuponesAsignados,
  formatDenominacionCuponSolicitud,
  formatEntreganteNombre,
  formatFechaAprobacionCombustible,
  formatMontoEntregaCombustible,
  formatSolicitanteNombre,
  formatVehiculoSolicitudCombustible,
} from "../solicitudes/lib/helpers";

function RequisicionRowItem({
  row,
  exporting,
  onExportExcel,
}: {
  row: SolicitudCombustibleRow;
  exporting: boolean;
  onExportExcel: (row: SolicitudCombustibleRow) => void;
}) {
  const cantidad = cantidadCuponesSolicitud(row);

  return (
    <GvTableMorphRow>
      <td className="px-4 py-3 align-middle text-sm tabular-nums">
        {formatFechaAprobacionCombustible(row.fecha_aprobacion)}
      </td>
      <td className="px-4 py-3 align-middle text-sm font-semibold">
        {formatVehiculoSolicitudCombustible(row)}
      </td>
      <td className="px-4 py-3 align-middle text-sm">{formatSolicitanteNombre(row)}</td>
      <td className="px-4 py-3 align-middle text-sm">{formatEntreganteNombre(row)}</td>
      <td className="px-4 py-3 align-middle text-sm tabular-nums">
        {formatCuponesAsignados(row)}
      </td>
      <td className="px-4 py-3 align-middle text-sm tabular-nums">{cantidad > 0 ? cantidad : "—"}</td>
      <td className="px-4 py-3 align-middle text-sm tabular-nums">
        {formatDenominacionCuponSolicitud(row)}
      </td>
      <td className="px-4 py-3 align-middle text-sm tabular-nums font-semibold">
        {formatMontoEntregaCombustible(row)}
      </td>
      <td className={gvTableActionTdClass}>
        <GestionVehiculosActionCell>
          <GvSigetActionButton
            label="Excel"
            accentColor={sigetAccent.excel}
            morphFrom={FileSpreadsheet}
            morphTo={ArrowDownToLine}
            onClick={() => onExportExcel(row)}
            disabled={exporting}
            ariaLabel="Descargar requisición en Excel"
            className="w-auto shrink-0"
          />
        </GestionVehiculosActionCell>
      </td>
    </GvTableMorphRow>
  );
}

export function RequisicionesList({
  requisiciones,
  exportingId = null,
  onExportExcel,
}: {
  requisiciones: SolicitudCombustibleRow[];
  exportingId?: string | null;
  onExportExcel: (row: SolicitudCombustibleRow) => void;
}) {
  if (requisiciones.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<FileText className="size-10" strokeWidth={1.75} />}
        title="Sin requisiciones"
        description="Apruebe una solicitud de combustible para generar la requisición oficial."
      />
    );
  }

  return (
    <GestionVehiculosTable>
      <GestionVehiculosThead
        cells={[
          { key: "fecha", label: "Fecha aprobación" },
          { key: "vehiculo", label: "Vehículo" },
          { key: "solicitante", label: "Solicitante" },
          { key: "entregante", label: "Entregado por" },
          { key: "cupones", label: "Cupones (del – al)" },
          { key: "cantidad", label: "Cantidad" },
          { key: "denominacion", label: "Denominación" },
          { key: "monto", label: "Monto entregado" },
          { key: "acciones", label: "Acciones", className: gvTableActionThClass },
        ]}
      />
      <tbody>
        {requisiciones.map((row) => (
          <RequisicionRowItem
            key={row.id}
            row={row}
            exporting={exportingId === row.id}
            onExportExcel={onExportExcel}
          />
        ))}
      </tbody>
    </GestionVehiculosTable>
  );
}
