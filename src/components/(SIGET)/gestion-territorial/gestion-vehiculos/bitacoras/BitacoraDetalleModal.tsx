"use client";

import { type BitacoraRow } from "./lib/zod";
import { BitacoraDetalleView } from "./BitacoraDetalleView";
import { GvModalShell, GV_MODAL_DETALLE_CONTENT_CLASS, GvModalInset } from "../lib/gv-modal-shell";

export function BitacoraDetalleModal({
  open,
  onClose,
  bitacora,
}: {
  open: boolean;
  onClose: () => void;
  bitacora: BitacoraRow | null;
}) {
  if (!bitacora) return null;

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
        <BitacoraDetalleView bitacora={bitacora} embedded onClose={onClose} />
      </GvModalInset>
    </GvModalShell>
  );
}
