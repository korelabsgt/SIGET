import { toast } from "react-toastify";

export { toast };

export const MODAL_ACTION_ERRORS: Record<string, string> = {
  UNAUTHORIZED: "Debes iniciar sesión.",
  FORBIDDEN: "No tienes permisos para esta acción.",
  INVALID_INPUT: "Revisa los datos del formulario.",
  DUPLICATE: "Este DPI ya está registrado en esta actividad.",
  DUPLICATE_NAME: "Ya existe una actividad con ese nombre.",
  NOT_FOUND: "La actividad no está disponible.",
  DB_ERROR: "No se pudo guardar. Intenta de nuevo.",
  SAVE_FAILED: "No se pudo guardar. Intenta de nuevo.",
  DELETE_FAILED: "No se pudo eliminar.",
  STORAGE_ERROR: "No se pudo guardar el archivo.",
  DUPLICATE_FILE: "Ya existe un archivo o carpeta con ese nombre.",
  LIMIT_FILES: "Máximo 5 archivos en esta pestaña.",
  HAS_CHILDREN:
    "Primero elimina o reubica las dependencias hijas y los puestos de esta unidad.",
  FIRST_PUESTO_JEFE_REQUIRED:
    "El primer puesto debe ser un jefe. Selecciona al menos una jefatura.",
  JEFE_REQUIRED:
    "Debe existir un jefe en esta dependencia antes de agregar más puestos.",
  PUESTO_HAS_CHILDREN:
    "Este puesto tiene dependencias o puestos bajo su cargo. Elimínalos o reubícalos antes de continuar.",
  SAME_DEPARTMENT: "El puesto ya está en esa dependencia.",
  JEFE_REQUIRED_LEAVE:
    "No puedes reubicar este jefe: quedarían puestos sin jefatura en la dependencia actual.",
  PUESTO_NOT_FOUND: "No se encontró el puesto.",
  JEFATURAS_SYNC_FAILED:
    "No se pudieron guardar las jefaturas. Revisa la tabla puesto_jefaturas en Supabase.",
  DROP_ES_JEFATURA:
    "Quita la columna es_jefatura de puestos en Supabase (ya no se usa).",
  ASSIGN_FAILED: "No se pudo asignar la persona al puesto.",
  LOAD_PROFILES_FAILED: "No se pudieron cargar los usuarios.",
};

export function modalActionMessage(
  code: string | undefined,
  fallback: string,
  extra?: Record<string, string>,
) {
  if (!code) return fallback;
  return extra?.[code] ?? MODAL_ACTION_ERRORS[code] ?? fallback;
}

export function actionErrorMessage(
  result: { error?: string | null; detail?: string | null },
  fallback: string,
) {
  if (result.detail?.trim()) return result.detail;
  return modalActionMessage(result.error ?? undefined, fallback);
}
