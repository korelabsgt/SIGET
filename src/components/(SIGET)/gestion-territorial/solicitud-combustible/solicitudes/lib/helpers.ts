import { montoTotalCuponesEntregados } from "../../../gestion-vehiculos/bitacoras/lib/combustible-mision";
import { formatFechaHoraGv } from "../../../gestion-vehiculos/lib/gv-fechas";
import { nombrePilotoSolicitud } from "../../../gestion-vehiculos/solicitudes/lib/helpers";
import { formatDenominacion } from "../../vales/lib/helpers";
import type { ValeLoteRow } from "../../vales/lib/zod";
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

export function misionesParaVinculoCombustible(
  solicitudes: SolicitudRow[],
  solicitanteId?: string | null,
): SolicitudRow[] {
  const sid = solicitanteId?.trim();
  return solicitudes
    .filter(esMisionVehiculoActiva)
    .filter((solicitud) => !sid || solicitud.solicitante_id === sid)
    .sort(
      (a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
    );
}

export function solicitudesVehiculoVinculables(
  solicitudes: SolicitudRow[],
  vehiculoId: string,
  solicitanteId?: string | null,
): SolicitudRow[] {
  const vehiculo = vehiculoId.trim();
  if (!vehiculo) return [];

  return misionesParaVinculoCombustible(solicitudes, solicitanteId).filter((solicitud) => {
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

export function pilotoRequisicionCombustible(row: SolicitudCombustibleRow): string {
  const mision = row.solicitud_vehiculo;
  if (!mision) {
    return formatSolicitanteNombre(row);
  }

  const solicitanteMision = mision.solicitante;
  const pilotoProfile = mision.piloto_profile;

  const nombre = nombrePilotoSolicitud({
    piloto: mision.piloto,
    piloto_profile: pilotoProfile
      ? {
          id: pilotoProfile.id,
          nombre: pilotoProfile.nombre ?? "",
          email: pilotoProfile.email ?? "",
        }
      : undefined,
    solicitante_id: mision.solicitante_id,
    solicitante: solicitanteMision
      ? {
          id: solicitanteMision.id,
          nombre: solicitanteMision.nombre ?? "",
          email: solicitanteMision.email ?? "",
        }
      : undefined,
  });

  if (nombre !== "Usuario registrado") return nombre;

  return (
    mision.piloto_profile?.email?.trim() ||
    mision.solicitante?.email?.trim() ||
    formatSolicitanteNombre(row)
  );
}

export function propositoEntregaCombustible(row: SolicitudCombustibleRow): string {
  const destino = row.solicitud_vehiculo?.destino?.trim();
  const comentarios = row.comentarios?.trim();

  if (destino && comentarios && comentarios !== destino) {
    return `${destino}. ${comentarios}`;
  }

  return destino || comentarios || "comisión oficial";
}

export function descripcionVehiculoCuentaCorriente(
  vehiculo: NonNullable<SolicitudCombustibleRow["vehiculo"]>,
): string {
  const marca = vehiculo.marca.trim();
  const modelo = vehiculo.modelo.trim();
  const placa = vehiculo.placa.trim().toUpperCase();
  const anio = vehiculo.anio;

  if (anio != null && modelo === String(anio)) {
    return `${marca}, modelo ${anio}, placas ${placa}`;
  }

  if (anio != null && /^\d{4}$/.test(modelo)) {
    return `${marca}, modelo ${modelo}, placas ${placa}`;
  }

  if (anio != null) {
    return `${marca}, modelo ${modelo} ${anio}, placas ${placa}`;
  }

  return `${marca}, modelo ${modelo}, placas ${placa}`;
}

export function conceptoEgresoCuentaCorrienteCupones(
  row: SolicitudCombustibleRow,
  numeroRequisicion: string,
): string {
  const vehiculo = row.vehiculo;
  const vehiculoTexto = vehiculo
    ? descripcionVehiculoCuentaCorriente(vehiculo)
    : "vehículo institucional";
  const beneficiario = formatSolicitanteNombre(row);
  const proposito = propositoEntregaCombustible(row);

  return (
    `Requisición de Combustible No.${numeroRequisicion}, para ${vehiculoTexto}, ` +
    `solicitado por ${beneficiario}, para ${proposito}.`
  );
}

export const REQUISICION_COMBUSTIBLE_ENTREGADO_POR = "María Fernanda Aguirre Azañón";

export const REQUISICION_COMBUSTIBLE_ENTREGADO_POR_CARGO = "Asistente Financiera OT";

export function formatEntreganteNombre(_row: SolicitudCombustibleRow): string {
  return REQUISICION_COMBUSTIBLE_ENTREGADO_POR;
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

export function denominacionCuponSolicitud(row: SolicitudCombustibleRow): number | null {
  if (row.denominacion_cupon == null) return null;
  const value = Number(row.denominacion_cupon);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function montoTotalEntregaCombustible(row: SolicitudCombustibleRow): number | null {
  const denominacion = denominacionCuponSolicitud(row);
  if (denominacion == null || row.cupon_del == null || row.cupon_al == null) return null;
  const cantidad = cantidadCuponesSolicitud(row);
  if (cantidad <= 0) return null;
  return montoTotalCuponesEntregados(row.cupon_del, row.cupon_al, denominacion);
}

export function loteValePorRangoCupones(
  row: Pick<SolicitudCombustibleRow, "cupon_del" | "cupon_al" | "denominacion_cupon">,
  vales: ValeLoteRow[],
): ValeLoteRow | null {
  if (row.cupon_del == null || row.cupon_al == null) return null;

  const denominacionGuardada =
    row.denominacion_cupon != null ? Number(row.denominacion_cupon) : null;

  const candidatos = vales.filter(
    (lote) => row.cupon_del! >= lote.cupon_del && row.cupon_al! <= lote.cupon_al,
  );

  if (candidatos.length === 0) return null;

  if (denominacionGuardada != null && Number.isFinite(denominacionGuardada)) {
    const porDenominacion = candidatos.find(
      (lote) => Number(lote.denominacion) === denominacionGuardada,
    );
    if (porDenominacion) return porDenominacion;
  }

  return [...candidatos].sort((a, b) => a.cupon_del - b.cupon_del)[0] ?? null;
}

export function denominacionCuponConInventario(
  row: SolicitudCombustibleRow,
  vales: ValeLoteRow[],
): number | null {
  const guardada = denominacionCuponSolicitud(row);
  if (guardada != null) return guardada;

  const lote = loteValePorRangoCupones(row, vales);
  if (!lote) return null;

  const inferida = Number(lote.denominacion);
  return Number.isFinite(inferida) && inferida > 0 ? inferida : null;
}

export function montoTotalEntregaCombustibleConInventario(
  row: SolicitudCombustibleRow,
  vales: ValeLoteRow[],
): number | null {
  const denominacion = denominacionCuponConInventario(row, vales);
  if (denominacion == null || row.cupon_del == null || row.cupon_al == null) return null;
  const cantidad = cantidadCuponesSolicitud(row);
  if (cantidad <= 0) return null;
  return montoTotalCuponesEntregados(row.cupon_del, row.cupon_al, denominacion);
}

export function fechaEgresoCombustible(row: SolicitudCombustibleRow): Date | null {
  const raw = row.fecha_aprobacion ?? row.fecha_solicitud;
  if (!raw) return null;
  const fecha = new Date(raw);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function formatDenominacionCuponSolicitud(row: SolicitudCombustibleRow): string {
  const denominacion = denominacionCuponSolicitud(row);
  if (denominacion == null) return "—";
  return formatDenominacion(denominacion);
}

export function formatMontoEntregaCombustible(row: SolicitudCombustibleRow): string {
  const monto = montoTotalEntregaCombustible(row);
  if (monto == null) return "—";
  return formatDenominacion(monto);
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
