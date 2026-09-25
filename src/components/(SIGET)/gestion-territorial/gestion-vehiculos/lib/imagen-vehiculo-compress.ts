import {
  ALLOWED_IMAGEN_TYPES,
  compressImagenFile,
  isAllowedImagenType,
} from "@/components/(base)/imgs/constants";

const JPG_ALIAS = "image/jpg";

export function esTipoImagenVehiculo(type: string): boolean {
  return isAllowedImagenType(type) || type === JPG_ALIAS;
}

export async function comprimirImagenVehiculo(file: File): Promise<File> {
  if (!esTipoImagenVehiculo(file.type)) {
    throw new Error("Formato no válido. Use JPG, PNG o WEBP.");
  }
  return compressImagenFile(file);
}

export const GV_IMAGEN_VEHICULO_TIPOS = [...ALLOWED_IMAGEN_TYPES, JPG_ALIAS] as const;

export const IMAGEN_VEHICULO_ACCEPT_ATTR =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,image/jpg";

/** En móvil prioriza cámara trasera; en escritorio se ignora. */
export const IMAGEN_VEHICULO_CAPTURE_ATTR = "environment" as const;
