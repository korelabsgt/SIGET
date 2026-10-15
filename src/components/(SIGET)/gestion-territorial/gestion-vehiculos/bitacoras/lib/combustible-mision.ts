export type CombustibleAprobadoMision = {
  cupon_del: number;
  cupon_al: number;
  denominacion_cupon: number | null;
};

export function formatValeCombustibleBitacora(cuponDel: number, cuponAl: number): string {
  return cuponDel === cuponAl ? String(cuponDel) : `${cuponDel} – ${cuponAl}`;
}

export function parseValeCombustibleBitacora(
  vale: string,
): { cupon_del: number; cupon_al: number } | null {
  const trimmed = vale.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    return n >= 1 ? { cupon_del: n, cupon_al: n } : null;
  }
  const match = trimmed.match(/^(\d+)\s*[–—-]\s*(\d+)$/);
  if (!match) return null;
  const cupon_del = Number(match[1]);
  const cupon_al = Number(match[2]);
  if (cupon_del < 1 || cupon_al < cupon_del) return null;
  return { cupon_del, cupon_al };
}

export function cuponesUsadosEnSolicitudCombustible(
  solicitud: Pick<CombustibleAprobadoMision, "cupon_del" | "cupon_al">,
  valesBitacora: string[],
): number {
  let usados = 0;
  for (const vale of valesBitacora) {
    const rango = parseValeCombustibleBitacora(vale);
    if (!rango) continue;
    if (rango.cupon_del < solicitud.cupon_del || rango.cupon_al > solicitud.cupon_al) {
      continue;
    }
    usados += cantidadCuponesRango(rango.cupon_del, rango.cupon_al);
  }
  return usados;
}

export function valeYMontoCuponesParciales(
  cuponDelInicio: number,
  cantidadCupones: number,
  denominacionCupon: number | null,
): { vale: string; monto: number } | null {
  if (cantidadCupones < 1) return null;
  const cuponAl = cuponDelInicio + cantidadCupones - 1;
  const datos = combustibleAprobadoParaBitacora({
    cupon_del: cuponDelInicio,
    cupon_al: cuponAl,
    denominacion_cupon: denominacionCupon,
  });
  if (!datos) return null;
  return { vale: datos.vale, monto: datos.monto };
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

export function misionRequiereReciboCombustible(
  row: CombustibleAprobadoMision | null | undefined,
): boolean {
  if (!row) return false;
  return combustibleAprobadoParaBitacora(row) !== null;
}
