import { differenceInDays } from "date-fns";
import { type VehiculoRow } from "./zod";

export type AlertStatus = "VERDE" | "AMARILLO" | "ROJO";

export function getDocumentAlertStatus(vencimientoSeguro?: string | null, vencimientoCirculacion?: string | null): AlertStatus {
  if (!vencimientoSeguro || !vencimientoCirculacion) return "ROJO"; // Si falta alguno, alerta roja inmediata.

  const diasSeguro = differenceInDays(new Date(vencimientoSeguro), new Date());
  const diasCirculacion = differenceInDays(new Date(vencimientoCirculacion), new Date());

  const diasMinimos = Math.min(diasSeguro, diasCirculacion);

  if (diasMinimos <= 0) return "ROJO";
  if (diasMinimos <= 30) return "AMARILLO";
  return "VERDE";
}

export function getMantenimientoAlertStatus(kmActual: number): { estado: AlertStatus; kmFaltantes: number; siguienteServicio: number } {
  // Mantenimiento cada 5,000 km.
  // Si tiene 0 km, su siguiente servicio es a los 5000.
  // Si tiene 5,000 km, ya necesita servicio, su hito era 5,000.
  const siguienteServicio = Math.ceil((kmActual + 1) / 5000) * 5000;
  const kmFaltantes = siguienteServicio - kmActual;

  let estado: AlertStatus = "VERDE";

  if (kmFaltantes <= 0) {
    estado = "ROJO";
  } else if (kmFaltantes <= 500) {
    estado = "AMARILLO";
  }

  return { estado, kmFaltantes, siguienteServicio };
}

export function getFleetSummary(vehiculos: VehiculoRow[]) {
  let documentosEnAlerta = 0; // Amarillo o Rojo
  let mantenimientoEnAlerta = 0; // Amarillo o Rojo

  vehiculos.forEach(v => {
    const docStatus = getDocumentAlertStatus(v.vencimiento_seguro, v.vencimiento_circulacion);
    if (docStatus === "AMARILLO" || docStatus === "ROJO") documentosEnAlerta++;

    const mantStatus = getMantenimientoAlertStatus(v.kilometraje_actual).estado;
    if (mantStatus === "AMARILLO" || mantStatus === "ROJO") mantenimientoEnAlerta++;
  });

  return { documentosEnAlerta, mantenimientoEnAlerta };
}
