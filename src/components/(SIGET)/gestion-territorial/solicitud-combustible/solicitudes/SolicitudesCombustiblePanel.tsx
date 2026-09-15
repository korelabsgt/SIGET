"use client";

import { useEffect, useState } from "react";

import type { SolicitudCombustibleRow } from "./lib/zod";
import { SolicitudCombustibleDetalleModal } from "./SolicitudCombustibleDetalleModal";
import { SolicitudesCombustibleCards } from "./SolicitudesCombustibleCards";
import { SolicitudesCombustibleList } from "./SolicitudesCombustibleList";

export function SolicitudesCombustiblePanel({
  solicitudes,
  catalogo,
  canResolver,
  canExport,
  onResolver,
  exportingId,
  onExportExcel,
}: {
  solicitudes: SolicitudCombustibleRow[];
  catalogo?: SolicitudCombustibleRow[];
  canResolver: boolean;
  canExport: boolean;
  onResolver: (row: SolicitudCombustibleRow, accion: "APROBAR" | "RECHAZAR") => void;
  exportingId?: string | null;
  onExportExcel?: (row: SolicitudCombustibleRow) => void;
}) {
  const [selected, setSelected] = useState<SolicitudCombustibleRow | null>(null);
  const fuente = catalogo ?? solicitudes;

  useEffect(() => {
    if (!selected?.id) return;
    const updated = fuente.find((row) => row.id === selected.id);
    if (updated) {
      setSelected(updated);
    } else {
      setSelected(null);
    }
  }, [fuente, selected?.id]);

  const showAccionesEnCards = canResolver || Boolean(onExportExcel);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="hidden min-h-0 flex-1 flex-col lg:flex">
          <SolicitudesCombustibleList solicitudes={solicitudes} onDetail={setSelected} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          <SolicitudesCombustibleCards
            solicitudes={solicitudes}
            canResolver={canResolver}
            showAccionesColumn={showAccionesEnCards}
            onResolver={onResolver}
            exportingId={exportingId}
            onExportExcel={onExportExcel}
          />
        </div>
      </div>

      <SolicitudCombustibleDetalleModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        solicitud={selected}
        canResolver={canResolver}
        canExport={canExport}
        exporting={exportingId === selected?.id}
        onResolver={onResolver}
        onExportExcel={onExportExcel}
      />
    </>
  );
}
