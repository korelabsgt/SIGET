import { fechaCalendarioGt, normalizarFechaCalendario } from "@/lib/fechas-gt";

export const VEHICULOS_STORAGE_BUCKET = "vehiculos";
export const VEHICULOS_SIGNED_URL_TTL_SEC = 3600;

/** Carpetas dentro del bucket `vehiculos` (Storage crea la ruta al subir el primer archivo). */
export const VEHICULOS_STORAGE_CARPETA_FLOTA = "flota";
export const VEHICULOS_STORAGE_CARPETA_FALLAS = "fallas";
export const VEHICULOS_STORAGE_CARPETA_RECIBOS = "recibos";

export function rutaStorageVehiculos(carpeta: string, nombreArchivo: string): string {
  const carpetaLimpia = carpeta.replace(/^\/+|\/+$/g, "");
  const archivo = nombreArchivo.replace(/^\/+/, "");
  return `${carpetaLimpia}/${archivo}`;
}

export function segmentoCarpetaPlacaVehiculo(placa: string): string {
  return (
    placa
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "vehiculo"
  );
}

export function rutaStorageFotoFlotaVehiculo(placa: string, nombreArchivo: string): string {
  const segmento = segmentoCarpetaPlacaVehiculo(placa);
  return rutaStorageVehiculos(`${VEHICULOS_STORAGE_CARPETA_FLOTA}/${segmento}`, nombreArchivo);
}

export function segmentoFechaCarpetaStorageVehiculos(fecha: string | Date = new Date()): string {
  if (fecha instanceof Date) return fechaCalendarioGt(fecha);
  const normalizada = normalizarFechaCalendario(fecha);
  return normalizada || fechaCalendarioGt();
}

function rutaStorageEvidenciaPorVehiculoYFecha(
  carpetaRaiz: string,
  placa: string,
  nombreArchivo: string,
  fecha: string | Date = new Date(),
): string {
  const segmentoPlaca = segmentoCarpetaPlacaVehiculo(placa);
  const segmentoFecha = segmentoFechaCarpetaStorageVehiculos(fecha);
  return rutaStorageVehiculos(
    `${carpetaRaiz}/${segmentoPlaca}/${segmentoFecha}`,
    nombreArchivo,
  );
}

export function rutaStorageEvidenciaFallaVehiculo(
  placa: string,
  nombreArchivo: string,
  fecha: string | Date = new Date(),
): string {
  return rutaStorageEvidenciaPorVehiculoYFecha(
    VEHICULOS_STORAGE_CARPETA_FALLAS,
    placa,
    nombreArchivo,
    fecha,
  );
}

export function rutaStorageReciboBitacoraVehiculo(
  placa: string,
  nombreArchivo: string,
  fecha: string | Date = new Date(),
): string {
  return rutaStorageEvidenciaPorVehiculoYFecha(
    VEHICULOS_STORAGE_CARPETA_RECIBOS,
    placa,
    nombreArchivo,
    fecha,
  );
}

export function isLocalImageSrc(value: string): boolean {
  return value.startsWith("blob:") || value.startsWith("data:");
}

export function normalizeVehiculoStoragePath(
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed || isLocalImageSrc(trimmed)) return null;

  const bucket = VEHICULOS_STORAGE_BUCKET;
  const markers = [
    `/storage/v1/object/public/${bucket}/`,
    `/storage/v1/object/sign/${bucket}/`,
    `/storage/v1/object/authenticated/${bucket}/`,
  ];

  for (const marker of markers) {
    const idx = trimmed.indexOf(marker);
    if (idx >= 0) {
      const rest = trimmed.slice(idx + marker.length).split("?")[0] ?? "";
      return decodeURIComponent(rest).replace(/^\//, "") || null;
    }
  }

  const bucketPrefix = `${bucket}/`;
  if (trimmed.startsWith(bucketPrefix)) {
    return trimmed.slice(bucketPrefix.length);
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const pathname = new URL(trimmed).pathname;
      const needle = `/${bucket}/`;
      const pos = pathname.indexOf(needle);
      if (pos >= 0) {
        return decodeURIComponent(pathname.slice(pos + needle.length)).replace(/^\//, "") || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  return trimmed.replace(/^\//, "") || null;
}
