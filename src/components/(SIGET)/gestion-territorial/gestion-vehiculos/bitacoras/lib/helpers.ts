import type { BitacoraRow } from "./zod";
import { parseComentariosJsonb } from "./zod";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  formatFechaCalendarioGt,
  normalizarFechaCalendario,
  normalizarMesCalendario,
} from "@/lib/fechas-gt";
import { registroEnPeriodoCalendario } from "../../lib/periodo-filtro";

export function normalizeBitacoraRow(row: BitacoraRow): BitacoraRow {
  return {
    ...row,
    comentarios: parseComentariosJsonb(row.comentarios),
  };
}

export function formatMesCalendarioLabel(mes: string): string {
  const norm = normalizarMesCalendario(mes);
  if (!norm) return "";
  const [y, m] = norm.split("-").map(Number);
  return format(new Date(y, m - 1, 1), "MMMM yyyy", { locale: es });
}

export function formatPeriodoCalendarioLabel(periodo: string): string {
  const fecha = normalizarFechaCalendario(periodo);
  if (fecha) {
    return formatFechaCalendarioGt(fecha, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return formatMesCalendarioLabel(periodo);
}

export function bitacoraEnMesCalendario(fecha: string, mes: string): boolean {
  return registroEnPeriodoCalendario(fecha, mes);
}

export function bitacoraEnPeriodoCalendario(fecha: string, periodo: string): boolean {
  return registroEnPeriodoCalendario(fecha, periodo);
}

export function computeMetricasBitacorasMes(
  bitacoras: BitacoraRow[],
  vehiculoFilter: string,
  periodoFilter: string,
  todosVehiculosValue = "__todos__",
) {
  const delMes = bitacoras.filter((bitacora) => {
    if (!bitacoraEnPeriodoCalendario(bitacora.fecha, periodoFilter)) return false;
    if (vehiculoFilter !== todosVehiculosValue && bitacora.vehiculo_id !== vehiculoFilter) {
      return false;
    }
    return true;
  });

  return {
    total_km: delMes.reduce((acc, bitacora) => acc + (bitacora.km_recorrido || 0), 0),
    total_combustible: delMes.reduce(
      (acc, bitacora) => acc + (Number(bitacora.monto_combustible) || 0),
      0,
    ),
    total_misiones: delMes.length,
  };
}

export type BitacoraAlertItem = {
  id: string;
  bitacora: BitacoraRow;
  severidad: "error" | "warn";
  titulo: string;
  detalle: string;
};

export function bitacoraSinCombustible(bitacora: BitacoraRow): boolean {
  if ((bitacora.km_recorrido ?? 0) <= 0) return false;
  const monto = Number(bitacora.monto_combustible) || 0;
  const vale = bitacora.vale_combustible?.trim();
  return monto <= 0 && !vale;
}

export function bitacoraSinSolicitud(bitacora: BitacoraRow): boolean {
  return !bitacora.solicitud_id && (bitacora.km_recorrido ?? 0) > 0;
}

export function getBitacoraAlerts(bitacoras: BitacoraRow[]): BitacoraAlertItem[] {
  const alertas: BitacoraAlertItem[] = [];

  for (const bitacora of bitacoras) {
    if (bitacoraSinCombustible(bitacora)) {
      const placa = bitacora.ter_vehiculos?.placa ?? "Vehículo";
      alertas.push({
        id: `${bitacora.id}-combustible`,
        bitacora,
        severidad: (bitacora.km_recorrido ?? 0) >= 100 ? "error" : "warn",
        titulo: "Sin combustible registrado",
        detalle: `${placa} · ${bitacora.km_recorrido} km sin vale ni monto`,
      });
    } else if (bitacoraSinSolicitud(bitacora)) {
      const placa = bitacora.ter_vehiculos?.placa ?? "Vehículo";
      alertas.push({
        id: `${bitacora.id}-solicitud`,
        bitacora,
        severidad: "warn",
        titulo: "Viaje sin solicitud vinculada",
        detalle: `${placa} · ${bitacora.destino}`,
      });
    }
  }

  return alertas.sort((a, b) => {
    if (a.severidad !== b.severidad) return a.severidad === "error" ? -1 : 1;
    return new Date(b.bitacora.fecha).getTime() - new Date(a.bitacora.fecha).getTime();
  });
}

export function extractVehiculosVinculadosBitacoras(bitacoras: BitacoraRow[]) {
  const map = new Map<
    string,
    { id: string; placa: string; marca: string; modelo: string; color?: string | null }
  >();

  for (const bitacora of bitacoras) {
    if (!bitacora.vehiculo_id || !bitacora.ter_vehiculos) continue;
    if (map.has(bitacora.vehiculo_id)) continue;
    map.set(bitacora.vehiculo_id, {
      id: bitacora.vehiculo_id,
      placa: bitacora.ter_vehiculos.placa,
      marca: bitacora.ter_vehiculos.marca,
      modelo: bitacora.ter_vehiculos.modelo,
    });
  }

  return Array.from(map.values()).sort((a, b) => a.placa.localeCompare(b.placa, "es"));
}

export function formatMontoCombustibleBitacora(monto: number) {
  if (monto <= 0) return "Sin recarga";
  return `Q. ${monto.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const MISION_VINCULABLE_SELECT = `
  id,
  destino,
  solicitante_id,
  vehiculo_id,
  estado,
  fecha_inicio,
  vehiculo:ter_vehiculos!vehiculo_id (kilometraje_actual)
`;

export type MisionVinculableBitacora = {
  id: string;
  destino: string;
  conductor_id: string;
  vehiculo_id: string;
  estado: string;
  ter_vehiculos: { kilometraje_actual: number } | null;
};

type SolicitudMisionRow = {
  id: string | null;
  destino: string | null;
  solicitante_id: string | null;
  vehiculo_id: string | null;
  estado: string | null;
  vehiculo:
    | { kilometraje_actual: number }
    | { kilometraje_actual: number }[]
    | null;
};

export function mapSolicitudAMisionVinculable(
  row: SolicitudMisionRow,
): MisionVinculableBitacora | null {
  if (!row.id || !row.vehiculo_id || !row.solicitante_id || !row.destino) return null;

  const vehiculoJoin = row.vehiculo;
  const ter_vehiculos = Array.isArray(vehiculoJoin)
    ? (vehiculoJoin[0] ?? null)
    : (vehiculoJoin ?? null);

  return {
    id: row.id,
    destino: row.destino,
    conductor_id: row.solicitante_id,
    vehiculo_id: row.vehiculo_id,
    estado: row.estado ?? "",
    ter_vehiculos: ter_vehiculos as { kilometraje_actual: number } | null,
  };
}

export function buildMisionesVinculablesList(
  enMision: SolicitudMisionRow[],
  finalizadas: SolicitudMisionRow[],
  solicitudesConBitacora: Set<string>,
): MisionVinculableBitacora[] {
  const activas = enMision
    .map(mapSolicitudAMisionVinculable)
    .filter((mision): mision is MisionVinculableBitacora => mision !== null);

  const activaIds = new Set(activas.map((mision) => mision.id));

  const ultimaFinalizadaSinBitacora = finalizadas
    .map(mapSolicitudAMisionVinculable)
    .filter(
      (mision): mision is MisionVinculableBitacora =>
        mision !== null &&
        !activaIds.has(mision.id) &&
        !solicitudesConBitacora.has(mision.id),
    )
    .slice(0, 1);

  return [...activas, ...ultimaFinalizadaSinBitacora];
}
