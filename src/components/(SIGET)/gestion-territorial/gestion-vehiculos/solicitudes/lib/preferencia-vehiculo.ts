import { nombreSolicitanteReserva } from "../../flota/lib/reserva-vehiculo";
import {
  diasReservaCalendarioGt,
  findConflictoDiaVehiculo,
  solicitudOcupaCalendarioVehiculo,
  type SolicitudCalendarioRef,
} from "./calendario-reservas";

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

const PRIORIDAD_RESERVA_CALENDARIO: Record<string, number> = {
  EN_MISION: 0,
  APROBADA: 1,
  PENDIENTE: 2,
};

export function solicitudesReservaEnDiaCalendario(
  diaCalendario: string,
  vehiculoId: string,
  solicitudes: SolicitudCalendarioConSolicitante[],
): SolicitudCalendarioConSolicitante[] {
  return solicitudes.filter((sol) => {
    if (sol.vehiculo_id !== vehiculoId) return false;
    if (!solicitudOcupaCalendarioVehiculo(sol)) return false;
    const dias = diasReservaCalendarioGt(sol.fecha_inicio, sol.fecha_fin_estimada);
    return dias.includes(diaCalendario);
  });
}

export function reservaPrioritariaEnDiaCalendario(
  diaCalendario: string,
  vehiculoId: string,
  solicitudes: SolicitudCalendarioConSolicitante[],
): SolicitudCalendarioConSolicitante | null {
  const enDia = solicitudesReservaEnDiaCalendario(diaCalendario, vehiculoId, solicitudes);
  if (enDia.length === 0) return null;
  return [...enDia].sort((a, b) => {
    const pa = PRIORIDAD_RESERVA_CALENDARIO[a.estado] ?? 99;
    const pb = PRIORIDAD_RESERVA_CALENDARIO[b.estado] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime();
  })[0];
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
