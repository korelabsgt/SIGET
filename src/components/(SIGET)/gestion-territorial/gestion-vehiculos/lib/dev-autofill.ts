import { fechaCalendarioGt, formatFechaManualGt, TIMEZONE_GT } from "@/lib/fechas-gt";

import type { BitacoraInput } from "../bitacoras/lib/zod";
import type { VehiculoInput } from "../flota/lib/zod";
import type { FallaMantenimientoFormData } from "../mantenimiento/lib/zod";
import type { SolicitudInput } from "../solicitudes/lib/zod";

function devSuffix(): string {
  return String(Date.now() % 1000).padStart(3, "0");
}

function devFechaManual(offsetDays = 30): string {
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return formatFechaManualGt(fechaCalendarioGt(base));
}

function devFechaHoraManual(offsetHours = 0): string {
  const date = new Date(Date.now() + offsetHours * 3600000);
  const fecha = formatFechaManualGt(fechaCalendarioGt(date));
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE_GT,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "08";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${fecha} ${hour}:${minute}`;
}

export function devAutofillVehiculoInput(): VehiculoInput {
  const suffix = devSuffix();
  return {
    placa: `P${suffix}SIM`,
    marca: "Toyota",
    modelo: "Hilux",
    color: "Blanco",
    anio: new Date().getFullYear() - 2,
    kilometraje_actual: 12500 + Number(suffix),
    estado: "LIBRE",
    vencimiento_seguro: devFechaManual(90),
    vencimiento_circulacion: devFechaManual(120),
    imagen_url: [],
  };
}

export function devAutofillSolicitudInput(vehiculoId?: string): SolicitudInput {
  return {
    fecha_inicio: devFechaHoraManual(24),
    fecha_fin_estimada: devFechaHoraManual(32),
    destino: "Ciudad de Guatemala",
    ruta_planificada: "CA-1 Occidente · Quetzaltenango",
    justificacion: "Visita de campo para seguimiento operativo del Plan Trifinio (simulación).",
    pasajeros: "",
    vehiculo_id: vehiculoId ?? "",
  };
}

export function devAutofillFallaInput(vehiculoId?: string): FallaMantenimientoFormData {
  return {
    vehiculo_id: vehiculoId ?? "",
    severidad: "MEDIA",
    descripcion: "Ruido intermitente en tren delantero al frenar (registro de prueba).",
    evidencia_url: [],
  };
}

type BitacoraAutofillOptions = {
  vehiculoId?: string;
  kmInicial?: number;
  misionId?: string | null;
};

export function devAutofillBitacoraInput(
  options: BitacoraAutofillOptions = {},
): BitacoraInput {
  const kmInicial = options.kmInicial ?? 12500;
  const recorrido = 45 + Number(devSuffix()) % 30;
  return {
    solicitud_id: options.misionId ?? "",
    vehiculo_id: options.vehiculoId ?? "",
    conductor_id: "",
    destino: "San Marcos · reunión territorial",
    km_inicial: kmInicial,
    km_final: kmInicial + recorrido,
    vale_combustible: `VALE-${devSuffix()}`,
    monto_combustible: 350,
    comentarios: [{ texto: "Recorrido de prueba generado automáticamente." }],
  };
}
