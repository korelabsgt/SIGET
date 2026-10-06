import { nombreSolicitanteReserva } from "../../flota/lib/reserva-vehiculo";
import { findConflictoDiaVehiculo, type SolicitudCalendarioRef } from "./calendario-reservas";

export type SolicitudCalendarioConSolicitante = SolicitudCalendarioRef & {
  solicitante?: { nombre?: string | null; email?: string | null } | null;
};

export type ConflictoPreferenciaVehiculo = {
  solicitanteNombre: string;
  dia: string;
};

export function mensajeVehiculoYaReservado(solicitanteNombre: string): string {
  return `Vehículo ya reservado por ${solicitanteNombre}`;
}

export function conflictoPreferenciaVehiculo(
  vehiculoId: string,
  fechaInicioIso: string,
  fechaFinIso: string,
  solicitudes: SolicitudCalendarioConSolicitante[],
): ConflictoPreferenciaVehiculo | null {
  const conflicto = findConflictoDiaVehiculo(
    {
      vehiculo_id: vehiculoId,
      fecha_inicio: fechaInicioIso,
      fecha_fin_estimada: fechaFinIso,
    },
    solicitudes,
    { incluirPendiente: true },
  );
  if (!conflicto) return null;

  const solicitud = solicitudes.find((row) => row.id === conflicto.solicitudId);
  return {
    solicitanteNombre: nombreSolicitanteReserva(solicitud?.solicitante),
    dia: conflicto.dia,
  };
}

export function mapaConflictosPreferenciaVehiculo(
  vehiculoIds: string[],
  fechaInicioIso: string,
  fechaFinIso: string,
  solicitudes: SolicitudCalendarioConSolicitante[],
): Record<string, ConflictoPreferenciaVehiculo> {
  const mapa: Record<string, ConflictoPreferenciaVehiculo> = {};
  for (const vehiculoId of vehiculoIds) {
    const conflicto = conflictoPreferenciaVehiculo(
      vehiculoId,
      fechaInicioIso,
      fechaFinIso,
      solicitudes,
    );
    if (conflicto) mapa[vehiculoId] = conflicto;
  }
  return mapa;
}
