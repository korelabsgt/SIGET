"use client";

import { GvModalShell } from "../lib/gv-modal-shell";
import { VehiculoGaleria } from "./VehiculoGaleria";
import { type VehiculoRow } from "./lib/zod";

export function VehiculoGaleriaModal({
  open,
  onClose,
  vehiculo,
}: {
  open: boolean;
  onClose: () => void;
  vehiculo: VehiculoRow | null;
}) {
  if (!vehiculo) return null;

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title="Fotografías"
      subtitle={`${vehiculo.placa} · ${vehiculo.marca} ${vehiculo.modelo}`}
      maxWidth="max-w-lg"
    >
      <VehiculoGaleria vehiculo={vehiculo} canManage={false} />
    </GvModalShell>
  );
}
