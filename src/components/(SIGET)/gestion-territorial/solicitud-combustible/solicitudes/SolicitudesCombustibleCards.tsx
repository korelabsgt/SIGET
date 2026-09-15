"use client";

import { Fuel } from "lucide-react";

import { GestionVehiculosTableEmpty } from "../../gestion-vehiculos/lib/table-ui";
import { GvMobileRecordList } from "../../gestion-vehiculos/lib/gv-mobile-record";

import type { SolicitudCombustibleRow } from "./lib/zod";
import { SolicitudCombustibleCard } from "./SolicitudCombustibleCard";

export function SolicitudesCombustibleCards({
  solicitudes,
  canResolver,
  showAccionesColumn = true,
  onResolver,
  exportingId = null,
  onExportExcel,
}: {
  solicitudes: SolicitudCombustibleRow[];
  canResolver: boolean;
  showAccionesColumn?: boolean;
  onResolver: (row: SolicitudCombustibleRow, accion: "APROBAR" | "RECHAZAR") => void;
  exportingId?: string | null;
  onExportExcel?: (row: SolicitudCombustibleRow) => void;
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
    <GvMobileRecordList>
      {solicitudes.map((row) => (
        <SolicitudCombustibleCard
          key={row.id}
          row={row}
          canResolver={canResolver}
          showAcciones={showAccionesColumn}
          onResolver={onResolver}
          exporting={exportingId === row.id}
          onExportExcel={onExportExcel}
        />
      ))}
    </GvMobileRecordList>
  );
}
