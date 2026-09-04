"use client";

import { type FallaRow, type MecanicoOption } from "./lib/zod";
import { FallaDetalleView } from "./FallaDetalleView";
import { GvModalShell, GV_MODAL_DETALLE_CONTENT_CLASS, GvModalInset } from "../lib/gv-modal-shell";

export function FallaDetalleModal({
  open,
  onClose,
  falla,
  mecanicos,
  isAuthorized,
}: {
  open: boolean;
  onClose: () => void;
  falla: FallaRow | null;
  mecanicos: MecanicoOption[];
  isAuthorized: boolean;
}) {
  if (!falla) return null;

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
        <FallaDetalleView
          falla={falla}
          mecanicos={mecanicos}
          isAuthorized={isAuthorized}
          embedded
          onClose={onClose}
        />
      </GvModalInset>
    </GvModalShell>
  );
}
