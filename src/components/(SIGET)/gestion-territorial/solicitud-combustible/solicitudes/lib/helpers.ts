import { formatFechaHoraGv } from "../../../gestion-vehiculos/lib/gv-fechas";
import type { SolicitudRow } from "../../../gestion-vehiculos/solicitudes/lib/zod";
import type { EstadoSolicitudCombustible, SolicitudCombustibleRow } from "./zod";

export const SIN_SOLICITUD_VEHICULO_VINCULO = "__sin_solicitud_vehiculo__";

const ESTADO_LABELS: Record<EstadoSolicitudCombustible, string> = {
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export function formatEstadoSolicitudCombustible(estado: EstadoSolicitudCombustible): string {
  return ESTADO_LABELS[estado] ?? estado;
}

export function esMisionVehiculoActiva(
  solicitud: Pick<SolicitudRow, "estado" | "fecha_fin_estimada">,
): boolean {
  if (solicitud.estado === "RECHAZADA" || solicitud.estado === "FINALIZADA") {
    return false;
  }

  const fin = new Date(solicitud.fecha_fin_estimada);
  if (Number.isNaN(fin.getTime())) {
    return false;
  }

  return fin.getTime() >= Date.now();
}

export function misionesParaVinculoCombustible(solicitudes: SolicitudRow[]): SolicitudRow[] {
  return solicitudes
    .filter(esMisionVehiculoActiva)
    .sort(
      (a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
    );
}

export function solicitudesVehiculoVinculables(
  solicitudes: SolicitudRow[],
  vehiculoId: string,
): SolicitudRow[] {
  const vehiculo = vehiculoId.trim();
  if (!vehiculo) return [];

  return misionesParaVinculoCombustible(solicitudes).filter((solicitud) => {
    if (!solicitud.vehiculo_id) return true;
    return solicitud.vehiculo_id === vehiculo;
  });
}

export function formatSolicitudVehiculoOpcionCombustible(solicitud: SolicitudRow): string {
  const fecha = formatFechaHoraGv(solicitud.fecha_inicio);
  const destino = solicitud.destino.trim() || "Sin destino";
  return `${destino} · ${fecha}`;
}

export function formatMisionVinculadaCombustible(row: SolicitudCombustibleRow): string {
  const mision = row.solicitud_vehiculo;
  if (!mision?.destino?.trim()) return "—";
  return mision.destino.trim();
}

export function formatVehiculoSolicitudCombustible(row: SolicitudCombustibleRow): string {
  const vehiculo = row.vehiculo;
  if (!vehiculo) return "—";
  return `${vehiculo.placa} · ${vehiculo.marca} ${vehiculo.modelo}`;
}

export function formatSolicitanteNombre(row: SolicitudCombustibleRow): string {
  return row.solicitante?.nombre?.trim() || row.solicitante?.email?.trim() || "—";
}

export function formatEntreganteNombre(row: SolicitudCombustibleRow): string {
  return row.entregante?.nombre?.trim() || row.entregante?.email?.trim() || "—";
}

export function formatFechaAprobacionCombustible(value: string | null): string {
  if (!value) return "—";
  return formatFechaHoraGv(value);
}

export function formatCuponesAsignados(row: SolicitudCombustibleRow): string {
  if (row.cupon_del == null || row.cupon_al == null) return "—";
  return row.cupon_del === row.cupon_al
    ? String(row.cupon_del)
    : `${row.cupon_del} – ${row.cupon_al}`;
}

export function formatFechaSolicitudCombustible(value: string): string {
  return formatFechaHoraGv(value);
}

export function cantidadCuponesSolicitud(row: SolicitudCombustibleRow): number {
  if (row.cupon_del == null || row.cupon_al == null) return 0;
  return row.cupon_al - row.cupon_del + 1;
}

export function estadoBadgeClassCombustible(estado: EstadoSolicitudCombustible): string {
  switch (estado) {
    case "PENDIENTE":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
    case "APROBADO":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "RECHAZADO":
      return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}
