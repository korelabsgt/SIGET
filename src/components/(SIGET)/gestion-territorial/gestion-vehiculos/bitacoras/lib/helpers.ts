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
