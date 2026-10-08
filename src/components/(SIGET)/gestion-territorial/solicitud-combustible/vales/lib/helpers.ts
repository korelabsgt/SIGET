import { formatFechaHoraGv } from "../../../gestion-vehiculos/lib/gv-fechas";
import type { ValeLoteRow } from "./zod";

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

export function formatValeLoteResumen(row: ValeLoteRow): string {
  return `${formatFondoLabel(row.fondo)} · ${formatDenominacion(row.denominacion)} · ${formatRangoCupones(row.cupon_del, row.cupon_al)}`;
}

export function formatValeLoteOpcionExport(row: ValeLoteRow): string {
  return `${formatRangoCupones(row.cupon_del, row.cupon_al)} · ${formatDenominacion(row.denominacion)}`;
}

export function formatValeLoteFecha(value: string): string {
  return formatFechaHoraGv(value);
}

export function valeLoteCoincideBusqueda(row: ValeLoteRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const candidatos = [
    formatFondoLabel(row.fondo),
    formatDenominacion(row.denominacion),
    formatRangoCupones(row.cupon_del, row.cupon_al),
    String(row.cupon_del),
    String(row.cupon_al),
    String(row.disponibles),
    String(row.cantidad),
    row.ultimo_entregado != null ? String(row.ultimo_entregado) : "",
    formatValeLoteFecha(row.created_at),
    formatValeLoteResumen(row),
  ];

  return candidatos.some((texto) => texto.toLowerCase().includes(q));
}

export function cuponesDisponiblesVale(row: ValeLoteRow): number {
  return Math.max(0, row.disponibles);
}

export function proximoCuponDisponible(row: ValeLoteRow): number | null {
  if (row.disponibles <= 0) return null;
  return (row.ultimo_entregado ?? row.cupon_del - 1) + 1;
}
