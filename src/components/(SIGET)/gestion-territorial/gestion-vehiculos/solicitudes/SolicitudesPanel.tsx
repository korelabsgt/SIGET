"use client";

import { useEffect, useState } from "react";
import { SolicitudesList } from "./SolicitudesList";
import { SolicitudesCards } from "./SolicitudesCards";
import { SolicitudDetalleModal } from "./SolicitudDetalleModal";
import { type SolicitudRow } from "./lib/zod";

export function SolicitudesPanel({
  solicitudes,
  catalogo,
  canManage,
  onAction,
  misionPendiente = false,
  detail,
  onDetailChange,
}: {
  solicitudes: SolicitudRow[];
  catalogo?: SolicitudRow[];
  canManage: boolean;
  onAction: (solicitud: SolicitudRow, action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR") => void;
  misionPendiente?: boolean;
  detail?: SolicitudRow | null;
  onDetailChange?: (solicitud: SolicitudRow | null) => void;
}) {
  const [internalDetail, setInternalDetail] = useState<SolicitudRow | null>(null);
  const isControlled = detail !== undefined;
  const selectedSolicitud = isControlled ? detail : internalDetail;
  const setSelectedSolicitud = isControlled
    ? (solicitud: SolicitudRow | null) => onDetailChange?.(solicitud)
    : setInternalDetail;
  const fuente = catalogo ?? solicitudes;

  useEffect(() => {
    if (!selectedSolicitud?.id) return;
    const updated = fuente.find((s) => s.id === selectedSolicitud.id);
    if (updated) {
      setSelectedSolicitud(updated);
    } else {
      setSelectedSolicitud(null);
    }
  }, [fuente, selectedSolicitud?.id]);

  return (
    <>
      <div className="hidden lg:block">
        <SolicitudesList solicitudes={solicitudes} onDetail={setSelectedSolicitud} />
      </div>
      <div className="lg:hidden">
        <SolicitudesCards solicitudes={solicitudes} onDetail={setSelectedSolicitud} />
      </div>

      <SolicitudDetalleModal
        open={selectedSolicitud !== null}
        onClose={() => setSelectedSolicitud(null)}
        solicitud={selectedSolicitud}
        canManage={canManage}
        misionPendiente={misionPendiente}
        onAction={onAction}
      />
    </>
  );
}
