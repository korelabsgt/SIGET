"use client";

import { type SolicitudRow } from "./lib/zod";
import { SolicitudDetalleView } from "./SolicitudDetalleView";
import { GvModalShell, GV_MODAL_DETALLE_CONTENT_CLASS, GvModalInset } from "../lib/gv-modal-shell";

export function SolicitudDetalleModal({
  open,
  onClose,
  solicitud,
  canManage,
  misionPendiente = false,
  onAction,
}: {
  open: boolean;
  onClose: () => void;
  solicitud: SolicitudRow | null;
  canManage: boolean;
  misionPendiente?: boolean;
  onAction: (solicitud: SolicitudRow, action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR") => void;
}) {
  if (!solicitud) return null;

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title=""
      maxWidth="max-w-3xl"
      sinHeader
      contentClassName={GV_MODAL_DETALLE_CONTENT_CLASS}
    >
      <GvModalInset>
        <SolicitudDetalleView
          solicitud={solicitud}
          canManage={canManage}
          misionPendiente={misionPendiente}
          embedded
          onClose={onClose}
          onAction={onAction}
        />
      </GvModalInset>
    </GvModalShell>
  );
}
