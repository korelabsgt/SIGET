import {
  fechaCalendarioGt,
  mesCalendarioGt,
  normalizarFechaCalendario,
  normalizarMesCalendario,
  timestamptzToMesCalendario,
} from "@/lib/fechas-gt";

export function registroEnPeriodoCalendario(fechaIso: string, periodo: string): boolean {
  const fechaNorm = normalizarFechaCalendario(periodo);
  if (fechaNorm) {
    const date = new Date(fechaIso);
    if (Number.isNaN(date.getTime())) return false;
    return fechaCalendarioGt(date) === fechaNorm;
  }

  const mesNorm = normalizarMesCalendario(periodo) || mesCalendarioGt();
  return timestamptzToMesCalendario(fechaIso) === mesNorm;
}
