import { fechaCalendarioGt } from "@/lib/fechas-gt";
import {
  diasReservaCalendarioGt,
  solicitudMarcaFlotaReservada,
} from "../../solicitudes/lib/calendario-reservas";
import type { SolicitudRow } from "../../solicitudes/lib/zod";

export type ReservaVehiculoDetalle = {
  id: string;
  estado: SolicitudRow["estado"];
  destino: string;
  solicitanteNombre: string;
  fechaInicio: string;
  fechaFinEstimada: string;
};

const PRIORIDAD_ESTADO: Record<string, number> = {
  EN_MISION: 0,
  APROBADA: 1,
  PENDIENTE: 2,
};

export function solicitudReservaActivaEnDia(
  solicitud: Pick<
    SolicitudRow,
    "estado" | "vehiculo_id" | "fecha_inicio" | "fecha_fin_estimada"
  >,
  vehiculoId: string,
  diaCalendario: string = fechaCalendarioGt(),
): boolean {
  if (solicitud.vehiculo_id !== vehiculoId) return false;
  if (!solicitudMarcaFlotaReservada(solicitud)) return false;
  if (solicitud.estado === "EN_MISION") return true;
  const dias = diasReservaCalendarioGt(solicitud.fecha_inicio, solicitud.fecha_fin_estimada);
  return dias.includes(diaCalendario);
}

export function ordenarReservasVehiculoHoy(
  reservas: ReservaVehiculoDetalle[],
): ReservaVehiculoDetalle[] {
  return [...reservas].sort((a, b) => {
    const pa = PRIORIDAD_ESTADO[a.estado] ?? 99;
    const pb = PRIORIDAD_ESTADO[b.estado] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime();
  });
}

export function nombreSolicitanteReserva(
  solicitante: { nombre?: string | null; email?: string | null } | null | undefined,
): string {
  const nombre = solicitante?.nombre?.trim();
  if (nombre) return nombre;
  const email = solicitante?.email?.trim();
  if (email) return email;
  return "Sin especificar";
}
