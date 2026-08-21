import type { BitacoraRow } from "./zod";

export function computeMetricasBitacorasMes(
  bitacoras: BitacoraRow[],
  vehiculoFilter: string,
  todosVehiculosValue = "__todos__",
) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const delMes = bitacoras.filter((bitacora) => {
    const fecha = new Date(bitacora.fecha);
    if (fecha < startOfMonth) return false;
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
