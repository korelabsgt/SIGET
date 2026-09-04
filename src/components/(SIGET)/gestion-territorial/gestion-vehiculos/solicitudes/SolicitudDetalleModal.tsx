"use client";

import { type SolicitudRow } from "./lib/zod";
import { SolicitudDetalleView } from "./SolicitudDetalleView";
import { GvModalShell, GV_MODAL_DETALLE_CONTENT_CLASS, GvModalInset } from "../lib/gv-modal-shell";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { canAprobarRechazarSolicitudes, canGestionarMisionSolicitud } from "../lib/permissions";
import { useGvPermissionRole } from "../lib/gv-permissions-hook";

export function SolicitudDetalleModal({
  open,
  onClose,
  solicitud,
  misionPendiente = false,
  onAction,
}: {
  open: boolean;
  onClose: () => void;
  solicitud: SolicitudRow | null;
  misionPendiente?: boolean;
  onAction: (solicitud: SolicitudRow, action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR") => void;
}) {
  const { user } = useUserContext();
  const gvRole = useGvPermissionRole();

  if (!solicitud) return null;

  const canAprobarRechazar = canAprobarRechazarSolicitudes(gvRole);
  const puedeControlMision = canGestionarMisionSolicitud(
    gvRole,
    solicitud.solicitante_id,
    user?.id,
  );

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title=""
      maxWidth="max-w-4xl"
      sinHeader
      contentClassName={GV_MODAL_DETALLE_CONTENT_CLASS}
    >
      <GvModalInset>
        <SolicitudDetalleView
          solicitud={solicitud}
          canAprobarRechazar={canAprobarRechazar}
          puedeControlMision={puedeControlMision}
          misionPendiente={misionPendiente}
          embedded
          onClose={onClose}
          onAction={onAction}
        />
      </GvModalInset>
    </GvModalShell>
  );
}
