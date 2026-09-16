import { differenceInDays } from "date-fns";

import {
  ESTADOS_VEHICULO,
  type AlertStatus,
  type EstadoVehiculo,
  type VehiculoRow,
} from "./zod";
import { normalizeVehiculoStoragePath } from "../../lib/storage";



export function getDocumentAlertStatus(vencimientoSeguro?: string | null, vencimientoCirculacion?: string | null): AlertStatus {

  if (!vencimientoSeguro || !vencimientoCirculacion) return "ROJO";



  const diasSeguro = differenceInDays(new Date(vencimientoSeguro), new Date());

  const diasCirculacion = differenceInDays(new Date(vencimientoCirculacion), new Date());



  const diasMinimos = Math.min(diasSeguro, diasCirculacion);



  if (diasMinimos <= 0) return "ROJO";

  if (diasMinimos <= 30) return "AMARILLO";

  return "VERDE";

}



export type VencimientoEtiqueta = "Al día" | "Próximo" | "Vencido" | "Sin registrar";

export function getVencimientoDocumentoStatus(fecha: string | null | undefined): {
  estado: AlertStatus;
  etiqueta: VencimientoEtiqueta;
  diasRestantes: number | null;
} {
  if (!fecha) {
    return { estado: "ROJO", etiqueta: "Sin registrar", diasRestantes: null };
  }

  const diasRestantes = differenceInDays(new Date(fecha), new Date());

  if (diasRestantes <= 0) {
    return { estado: "ROJO", etiqueta: "Vencido", diasRestantes };
  }

  if (diasRestantes <= 30) {
    return { estado: "AMARILLO", etiqueta: "Próximo", diasRestantes };
  }

  return { estado: "VERDE", etiqueta: "Al día", diasRestantes };
}

export function getAlertStatusClasses(estado: AlertStatus) {
  switch (estado) {
    case "VERDE":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
    case "AMARILLO":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    case "ROJO":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
  }
}

export const KM_INTERVALO_SERVICIO = 5000;
export const KM_MARGEN_MANTENIMIENTO_FORZADO = 500;
export const PREFIJO_FALLA_SERVICIO_KM = "[SERVICIO-KM:";

export function getUmbralMantenimientoForzadoKm(kmActual: number): number | null {
  const minimo = KM_INTERVALO_SERVICIO + KM_MARGEN_MANTENIMIENTO_FORZADO;
  if (kmActual < minimo) return null;
  return (
    Math.floor((kmActual - KM_MARGEN_MANTENIMIENTO_FORZADO) / KM_INTERVALO_SERVICIO)
      * KM_INTERVALO_SERVICIO
    + KM_MARGEN_MANTENIMIENTO_FORZADO
  );
}

export function getUmbralesMantenimientoForzadoAlcanzados(kmActual: number): number[] {
  const ultimo = getUmbralMantenimientoForzadoKm(kmActual);
  if (ultimo === null) return [];
  const primero = KM_INTERVALO_SERVICIO + KM_MARGEN_MANTENIMIENTO_FORZADO;
  const umbrales: number[] = [];
  for (let umbral = primero; umbral <= ultimo; umbral += KM_INTERVALO_SERVICIO) {
    umbrales.push(umbral);
  }
  return umbrales;
}

export function buildDescripcionFallaServicioKm(umbral: number): string {
  return `${PREFIJO_FALLA_SERVICIO_KM}${umbral}] Servicio programado: el vehículo alcanzó ${umbral.toLocaleString("es-GT")} km.`;
}

export function parseUmbralServicioKm(descripcion: string): number | null {
  const match = descripcion.match(/\[SERVICIO-KM:(\d+)\]/);
  return match ? Number(match[1]) : null;
}

export function esFallaServicioKmProgramado(descripcion: string): boolean {
  return parseUmbralServicioKm(descripcion) !== null;
}

export type FallaServicioKmRef = {
  vehiculo_id: string;
  descripcion: string;
  estado: string;
};

export type FleetAlertItem = {
  id: string;
  vehiculo_id: string;
  placa: string;
  titulo: string;
  detalle: string;
  severidad: "error" | "warn";
};

export function getFleetServicioKmForzadoAlerts(
  vehiculos: VehiculoRow[],
  fallas: FallaServicioKmRef[],
): FleetAlertItem[] {
  const placaById = new Map(
    vehiculos.filter((v) => v.id).map((v) => [v.id as string, v.placa]),
  );
  const alerts: FleetAlertItem[] = [];

  for (const falla of fallas) {
    if (falla.estado !== "PENDIENTE" && falla.estado !== "EN_REPARACION") continue;
    const umbral = parseUmbralServicioKm(falla.descripcion);
    if (umbral === null) continue;

    alerts.push({
      id: `${falla.vehiculo_id}-servicio-km-${umbral}`,
      vehiculo_id: falla.vehiculo_id,
      placa: placaById.get(falla.vehiculo_id) ?? "—",
      titulo: "En mantenimiento por servicio",
      detalle: `Alcanzó ${umbral.toLocaleString("es-GT")} km y pasó automáticamente a mantenimiento.`,
      severidad: "error",
    });
  }

  return alerts;
}

export function getMantenimientoAlertStatus(kmActual: number): { estado: AlertStatus; kmFaltantes: number; siguienteServicio: number } {

  const siguienteServicio = Math.ceil((kmActual + 1) / KM_INTERVALO_SERVICIO) * KM_INTERVALO_SERVICIO;

  const kmFaltantes = siguienteServicio - kmActual;



  let estado: AlertStatus = "VERDE";



  if (kmFaltantes <= 0) {

    estado = "ROJO";

  } else if (kmFaltantes <= KM_MARGEN_MANTENIMIENTO_FORZADO) {

    estado = "AMARILLO";

  }



  return { estado, kmFaltantes, siguienteServicio };

}



export type FleetAlertNotification = {

  id: string;

  severidad: "error" | "warn";

  mensaje: string;

};



const MAX_PLACAS_EN_TOAST = 4;



function formatPlacaLine(placa: string, detalle: string) {

  return `• ${placa} — ${detalle}`;

}



function formatPlacaList(lines: string[]) {

  if (lines.length <= MAX_PLACAS_EN_TOAST) return lines.join("\n");

  const visibles = lines.slice(0, MAX_PLACAS_EN_TOAST);

  return `${visibles.join("\n")}\n• y ${lines.length - MAX_PLACAS_EN_TOAST} más…`;

}



export function getFleetAlertNotifications(

  vehiculos: VehiculoRow[],

  fallasServicioKm: FallaServicioKmRef[] = [],

): FleetAlertNotification[] {

  const docsError: string[] = [];

  const docsWarn: string[] = [];

  const mantError: string[] = [];

  const mantWarn: string[] = [];

  const servicioKm: string[] = [];



  for (const vehiculo of vehiculos) {

    const docStatus = getDocumentAlertStatus(

      vehiculo.vencimiento_seguro,

      vehiculo.vencimiento_circulacion,

    );

    if (docStatus === "ROJO") {

      docsError.push(formatPlacaLine(vehiculo.placa, "vencidos o faltantes"));

    } else if (docStatus === "AMARILLO") {

      docsWarn.push(formatPlacaLine(vehiculo.placa, "próximos a vencer"));

    }



    const mantenimiento = getMantenimientoAlertStatus(vehiculo.kilometraje_actual);

    if (mantenimiento.estado === "ROJO") {

      mantError.push(formatPlacaLine(vehiculo.placa, "mantenimiento vencido"));

    } else if (mantenimiento.estado === "AMARILLO") {

      mantWarn.push(

        formatPlacaLine(

          vehiculo.placa,

          `servicio en ${mantenimiento.kmFaltantes.toLocaleString()} km`,

        ),

      );

    }

  }

  for (const falla of fallasServicioKm) {
    if (falla.estado !== "PENDIENTE" && falla.estado !== "EN_REPARACION") continue;
    const umbral = parseUmbralServicioKm(falla.descripcion);
    if (umbral === null) continue;
    const placa =
      vehiculos.find((vehiculo) => vehiculo.id === falla.vehiculo_id)?.placa ?? "—";
    servicioKm.push(
      formatPlacaLine(placa, `pasó a mantenimiento al alcanzar ${umbral.toLocaleString("es-GT")} km`),
    );
  }



  const notifications: FleetAlertNotification[] = [];



  if (docsError.length > 0) {

    notifications.push({

      id: "flota-docs-error",

      severidad: "error",

      mensaje: `Documentos críticos (${docsError.length})\n${formatPlacaList(docsError)}`,

    });

  }



  if (docsWarn.length > 0) {

    notifications.push({

      id: "flota-docs-warn",

      severidad: "warn",

      mensaje: `Documentos por vencer (${docsWarn.length})\n${formatPlacaList(docsWarn)}`,

    });

  }



  if (mantError.length > 0) {

    notifications.push({

      id: "flota-mant-error",

      severidad: "error",

      mensaje: `Mantenimiento vencido (${mantError.length})\n${formatPlacaList(mantError)}`,

    });

  }



  if (mantWarn.length > 0) {

    notifications.push({

      id: "flota-mant-warn",

      severidad: "warn",

      mensaje: `Mantenimiento próximo (${mantWarn.length})\n${formatPlacaList(mantWarn)}`,

    });

  }

  if (servicioKm.length > 0) {

    notifications.push({

      id: "flota-servicio-km",

      severidad: "error",

      mensaje: `Pasaron a mantenimiento por kilometraje (${servicioKm.length})\n${formatPlacaList(servicioKm)}`,

    });

  }



  return notifications;

}

export function getFleetAllAlerts(
  vehiculos: VehiculoRow[],
  fallasServicioKm: FallaServicioKmRef[] = [],
): FleetAlertItem[] {
  const alerts: FleetAlertItem[] = [];

  for (const vehiculo of vehiculos) {
    const docStatus = getDocumentAlertStatus(
      vehiculo.vencimiento_seguro,
      vehiculo.vencimiento_circulacion,
    );

    if (docStatus === "ROJO") {
      alerts.push({
        id: `${vehiculo.id ?? vehiculo.placa}-docs-crit`,
        vehiculo_id: vehiculo.id ?? vehiculo.placa,
        placa: vehiculo.placa,
        titulo: "Documentos críticos",
        detalle: "Seguro o circulación vencidos o sin registrar",
        severidad: "error",
      });
    } else if (docStatus === "AMARILLO") {
      alerts.push({
        id: `${vehiculo.id ?? vehiculo.placa}-docs-warn`,
        vehiculo_id: vehiculo.id ?? vehiculo.placa,
        placa: vehiculo.placa,
        titulo: "Documentos por vencer",
        detalle: "Seguro o circulación vence en los próximos 30 días",
        severidad: "warn",
      });
    }

    const mantenimiento = getMantenimientoAlertStatus(vehiculo.kilometraje_actual);

    if (mantenimiento.estado === "ROJO") {
      alerts.push({
        id: `${vehiculo.id ?? vehiculo.placa}-mant-crit`,
        vehiculo_id: vehiculo.id ?? vehiculo.placa,
        placa: vehiculo.placa,
        titulo: "Mantenimiento vencido",
        detalle: `Servicio debió realizarse a los ${mantenimiento.siguienteServicio.toLocaleString()} km`,
        severidad: "error",
      });
    } else if (mantenimiento.estado === "AMARILLO") {
      alerts.push({
        id: `${vehiculo.id ?? vehiculo.placa}-mant-warn`,
        vehiculo_id: vehiculo.id ?? vehiculo.placa,
        placa: vehiculo.placa,
        titulo: "Mantenimiento próximo",
        detalle: `Servicio programado en ${mantenimiento.kmFaltantes.toLocaleString()} km`,
        severidad: "warn",
      });
    }
  }

  alerts.push(...getFleetServicioKmForzadoAlerts(vehiculos, fallasServicioKm));

  return alerts;
}

export type FleetMediumAlert = FleetAlertItem;

export function getFleetMediumAlerts(
  vehiculos: VehiculoRow[],
  fallasServicioKm: FallaServicioKmRef[] = [],
): FleetMediumAlert[] {
  return getFleetAllAlerts(vehiculos, fallasServicioKm).filter((alerta) => alerta.severidad === "warn");
}

export function estadoVehiculoNormalizado(
  estado: string | null | undefined,
): string {
  return (estado ?? "").trim().toUpperCase().replace(/\s+/g, "_");
}

export function esVehiculoDisponible(
  vehiculo: Pick<VehiculoRow, "estado">,
): boolean {
  const estado = estadoVehiculoNormalizado(vehiculo.estado);
  return estado === "LIBRE" || estado === "DISPONIBLE";
}

export const PLACAS_SIEMPRE_RESERVADAS: readonly string[] = [];

export function esPlacaSiempreReservada(placa: string | null | undefined): boolean {
  const normalizada = (placa ?? "").trim().toUpperCase();
  if (!normalizada) return false;
  return PLACAS_SIEMPRE_RESERVADAS.includes(normalizada);
}

export function estadoVehiculoConReservaFija(
  placa: string | null | undefined,
  estado: EstadoVehiculo,
): EstadoVehiculo {
  if (estado === "LIBRE" && esPlacaSiempreReservada(placa)) return "RESERVADO";
  return estado;
}

export function estadosVehiculoSeleccionables(
  placa: string | null | undefined,
): readonly EstadoVehiculo[] {
  if (!esPlacaSiempreReservada(placa)) return ESTADOS_VEHICULO;
  return ESTADOS_VEHICULO.filter((estado) => estado !== "LIBRE");
}

export function formatVehiculoOpcion(
  v: Pick<VehiculoRow, "placa" | "marca" | "modelo"> & { color?: string | null },
): string {
  const base = `${v.placa} · ${v.marca} ${v.modelo}`;
  const color = v.color?.trim();
  return color ? `${base} · ${color}` : base;
}

export const MAX_FOTOS_VEHICULO = 4;
export const MIN_FOTOS_VEHICULO = 1;
export const MAX_FOTOS_UNIDAD = 3;

export const CIRCULACION_PATH_MARKER = "_circulacion_";

export type TipoFotoVehiculo = "unidad" | "circulacion";

export function esFotoTarjetaCirculacion(path: string | null | undefined): boolean {
  const valor = path?.trim();
  if (!valor) return false;
  const normalizado = normalizeVehiculoStoragePath(valor) ?? valor;
  return normalizado.toLowerCase().includes(CIRCULACION_PATH_MARKER);
}

export function separarFotosVehiculo(vehiculo: Pick<VehiculoRow, "imagen_url">): {
  unidad: string[];
  tarjetaCirculacion: string | null;
} {
  const fotos = fotosVehiculo(vehiculo);
  return {
    unidad: fotos.filter((foto) => !esFotoTarjetaCirculacion(foto)),
    tarjetaCirculacion: fotos.find((foto) => esFotoTarjetaCirculacion(foto)) ?? null,
  };
}

export function fotosUnidadVehiculo(vehiculo: Pick<VehiculoRow, "imagen_url">): string[] {
  return separarFotosVehiculo(vehiculo).unidad;
}

export function combinarFotosVehiculo(
  unidad: string[],
  tarjetaCirculacion: string | null,
): string[] {
  return [...unidad, ...(tarjetaCirculacion ? [tarjetaCirculacion] : [])];
}

function normalizarFotoPaths(paths: string[]): string[] {
  const normalized = paths
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((url) => normalizeVehiculoStoragePath(url) ?? url.trim())
    .filter((url) => url.length > 0);
  return [...new Set(normalized)].slice(0, MAX_FOTOS_VEHICULO);
}

export function fotosVehiculo(vehiculo: Pick<VehiculoRow, "imagen_url">): string[] {
  return normalizarFotoPaths(vehiculo.imagen_url ?? []);
}

export function imagenUrlParaDb(fotos: string[]): string[] {
  return normalizarFotoPaths(fotos);
}

export function normalizeVehiculoRow(row: VehiculoRow): VehiculoRow {
  const fotos = fotosVehiculo(row);
  return {
    ...row,
    imagen_url: fotos,
  };
}

export function formatEstadoVehiculoLabel(estado: VehiculoRow["estado"]): string {
  switch (estado) {
    case "LIBRE":
      return "Libre";
    case "RESERVADO":
      return "Reservado";
    case "EN_MANTENIMIENTO":
      return "Mantenimiento";
  }
}

