import type { BitacoraRow } from "./zod";

export const ESTADOS_BITACORA = ["PENDIENTE", "CONFIRMADA"] as const;
export type EstadoBitacora = (typeof ESTADOS_BITACORA)[number];

export function estadoBitacoraNormalizado(
  estado: string | null | undefined,
): EstadoBitacora {
  return estado === "PENDIENTE" ? "PENDIENTE" : "CONFIRMADA";
}

export function esBitacoraPendiente(
  bitacora: Pick<BitacoraRow, "estado">,
): boolean {
  return estadoBitacoraNormalizado(bitacora.estado) === "PENDIENTE";
}

export function esBitacoraConfirmada(
  bitacora: Pick<BitacoraRow, "estado">,
): boolean {
  return estadoBitacoraNormalizado(bitacora.estado) === "CONFIRMADA";
}

export function formatEstadoBitacoraLabel(estado: string | null | undefined): string {
  return estadoBitacoraNormalizado(estado) === "PENDIENTE"
    ? "Pendiente"
    : "Confirmada";
}
