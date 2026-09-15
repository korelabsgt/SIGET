export type CombustibleAprobadoMision = {
  cupon_del: number;
  cupon_al: number;
  denominacion_cupon: number | null;
};

export function formatValeCombustibleBitacora(cuponDel: number, cuponAl: number): string {
  return cuponDel === cuponAl ? String(cuponDel) : `${cuponDel} – ${cuponAl}`;
}

export function cantidadCuponesRango(cuponDel: number, cuponAl: number): number {
  return cuponAl - cuponDel + 1;
}

export function montoTotalCuponesEntregados(
  cuponDel: number,
  cuponAl: number,
  denominacion: number,
): number {
  const cantidad = cantidadCuponesRango(cuponDel, cuponAl);
  return Math.round(cantidad * denominacion * 100) / 100;
}

export function combustibleAprobadoParaBitacora(
  row: CombustibleAprobadoMision,
): { vale: string; monto: number; cantidad: number } | null {
  const { cupon_del, cupon_al, denominacion_cupon } = row;
  if (cupon_del == null || cupon_al == null || cupon_del < 1 || cupon_al < cupon_del) {
    return null;
  }

  const vale = formatValeCombustibleBitacora(cupon_del, cupon_al);
  const cantidad = cantidadCuponesRango(cupon_del, cupon_al);
  const denom = denominacion_cupon != null ? Number(denominacion_cupon) : 0;
  const monto = denom > 0 ? montoTotalCuponesEntregados(cupon_del, cupon_al, denom) : 0;

  return { vale, monto, cantidad };
}
