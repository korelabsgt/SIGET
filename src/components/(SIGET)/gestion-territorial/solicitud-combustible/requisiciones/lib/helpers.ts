import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { RequisicionRow } from "./zod";

export function formatFondoLabel(fondo: string): string {
  return fondo.trim().toUpperCase();
}

export function formatDenominacion(value: number): string {
  return `Q. ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatRangoCupones(cuponDel: number, cuponAl: number): string {
  return cuponDel === cuponAl ? String(cuponDel) : `${cuponDel} – ${cuponAl}`;
}

export function formatRequisicionResumen(row: RequisicionRow): string {
  return `${formatFondoLabel(row.fondo)} · ${formatDenominacion(row.denominacion)} · ${formatRangoCupones(row.cupon_del, row.cupon_al)}`;
}

export function formatRequisicionFecha(value: string): string {
  return format(new Date(value), "dd/MM/yyyy", { locale: es });
}

export function cuponesDisponiblesRequisicion(row: RequisicionRow): number {
  return Math.max(0, row.disponibles);
}

export function proximoCuponDisponible(row: RequisicionRow): number | null {
  if (row.disponibles <= 0) return null;
  return (row.ultimo_entregado ?? row.cupon_del - 1) + 1;
}
