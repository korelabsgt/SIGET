import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { EstadoSolicitudCombustible, SolicitudCombustibleRow } from "./zod";

const ESTADO_LABELS: Record<EstadoSolicitudCombustible, string> = {
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export function formatEstadoSolicitudCombustible(estado: EstadoSolicitudCombustible): string {
  return ESTADO_LABELS[estado] ?? estado;
}

export function formatVehiculoSolicitudCombustible(row: SolicitudCombustibleRow): string {
  const vehiculo = row.vehiculo;
  if (!vehiculo) return "—";
  return `${vehiculo.placa} · ${vehiculo.marca} ${vehiculo.modelo}`;
}

export function formatSolicitanteNombre(row: SolicitudCombustibleRow): string {
  return row.solicitante?.nombre?.trim() || row.solicitante?.email?.trim() || "—";
}

export function formatCuponesAsignados(row: SolicitudCombustibleRow): string {
  if (row.cupon_del == null || row.cupon_al == null) return "—";
  return row.cupon_del === row.cupon_al
    ? String(row.cupon_del)
    : `${row.cupon_del} – ${row.cupon_al}`;
}

export function formatFechaSolicitudCombustible(value: string): string {
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: es });
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
