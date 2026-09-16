import { registroEnPeriodoCalendario } from "../../../gestion-vehiculos/lib/periodo-filtro";
import type { SolicitudCombustibleRow } from "../../solicitudes/lib/zod";

export const TODOS_VEHICULOS_REQUISICION = "__todos__";

function pasaFiltroVehiculoCombustible(
  row: SolicitudCombustibleRow,
  vehiculoFilter: string,
): boolean {
  if (vehiculoFilter === TODOS_VEHICULOS_REQUISICION) return true;
  return row.vehiculo_id === vehiculoFilter;
}

export function filtrarSolicitudesCombustible(
  solicitudes: SolicitudCombustibleRow[],
  periodoFilter: string,
  vehiculoFilter: string,
): SolicitudCombustibleRow[] {
  return solicitudes.filter((row) => {
    if (!registroEnPeriodoCalendario(row.fecha_solicitud, periodoFilter)) return false;
    return pasaFiltroVehiculoCombustible(row, vehiculoFilter);
  });
}

export function vehiculosEnRequisiciones(rows: SolicitudCombustibleRow[]) {
  const map = new Map<
    string,
    NonNullable<SolicitudCombustibleRow["vehiculo"]> & { id: string }
  >();
  for (const row of rows) {
    const vehiculo = row.vehiculo;
    if (vehiculo?.id) {
      map.set(vehiculo.id, vehiculo);
    }
  }
  return [...map.values()].sort((a, b) => a.placa.localeCompare(b.placa, "es"));
}

export function filtrarRequisicionesCombustible(
  solicitudes: SolicitudCombustibleRow[],
  vehiculoFilter: string,
  periodoFilter: string,
): SolicitudCombustibleRow[] {
  return solicitudes
    .filter((row) => row.estado === "APROBADO")
    .filter((row) => {
      const fecha = row.fecha_aprobacion ?? row.fecha_solicitud;
      return registroEnPeriodoCalendario(fecha, periodoFilter);
    })
    .filter((row) => pasaFiltroVehiculoCombustible(row, vehiculoFilter))
    .sort((a, b) => {
      const ta = a.fecha_aprobacion ? new Date(a.fecha_aprobacion).getTime() : 0;
      const tb = b.fecha_aprobacion ? new Date(b.fecha_aprobacion).getTime() : 0;
      return tb - ta;
    });
}
