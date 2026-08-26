import type { ActividadRecord } from "./zod";
import { normalizarFechaInput } from "./zod";

export type TabAsistenciaActividades = "propios" | "otros";

export type GrupoMesActividades = {
  mesKey: string;
  etiqueta: string;
  actividades: ActividadRecord[];
};

const MESES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export function isPrivilegedAsistenciaRole(role: string): boolean {
  const normalized = role.toLowerCase();
  return normalized === "super" || normalized.includes("admin");
}

export function canEliminarActividadAsistencia(role: string): boolean {
  return role.toLowerCase() === "super";
}

export function esActividadPropia(
  actividad: ActividadRecord,
  userId: string | null | undefined,
): boolean {
  if (!userId || !actividad.created_by) return false;
  return actividad.created_by === userId;
}

export function fechaActividadKey(fecha: string): string {
  return normalizarFechaInput(fecha).slice(0, 10);
}

export function mesActividadKey(fecha: string): string {
  return fechaActividadKey(fecha).slice(0, 7);
}

export function etiquetaMesActividad(mesKey: string): string {
  const [anioStr, mesStr] = mesKey.split("-");
  const anio = Number(anioStr);
  const mes = Number(mesStr);
  if (!anio || !mes || mes < 1 || mes > 12) return mesKey || "Sin fecha";
  return `${MESES_ES[mes - 1]} ${anio}`;
}

export function sortActividadesPorFechaDesc(
  actividades: ActividadRecord[],
): ActividadRecord[] {
  return [...actividades].sort((a, b) => {
    const fechaCmp = fechaActividadKey(b.fecha_realizacion).localeCompare(
      fechaActividadKey(a.fecha_realizacion),
    );
    if (fechaCmp !== 0) return fechaCmp;

    const nombreCmp = a.nombre.localeCompare(b.nombre, "es");
    if (nombreCmp !== 0) return nombreCmp;

    return (a.creador_nombre ?? "").localeCompare(b.creador_nombre ?? "", "es");
  });
}

export function agruparActividadesPorMes(
  actividades: ActividadRecord[],
): GrupoMesActividades[] {
  const ordenadas = sortActividadesPorFechaDesc(actividades);
  const grupos = new Map<string, ActividadRecord[]>();

  for (const act of ordenadas) {
    const mesKey = mesActividadKey(act.fecha_realizacion) || "sin-fecha";
    const lista = grupos.get(mesKey);
    if (lista) lista.push(act);
    else grupos.set(mesKey, [act]);
  }

  return Array.from(grupos.entries()).map(([mesKey, items]) => ({
    mesKey,
    etiqueta:
      mesKey === "sin-fecha" ? "Sin fecha" : etiquetaMesActividad(mesKey),
    actividades: items,
  }));
}

export function etiquetaEncargado(actividad: ActividadRecord): string {
  return actividad.creador_nombre?.trim() || "Sin encargado";
}

const UUID_ACTividad_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function esUuidActividad(value: string): boolean {
  return UUID_ACTividad_RE.test(value);
}

export function slugifyNombreActividad(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugActividadDesdeRecord(actividad: Pick<ActividadRecord, "slug" | "nombre">): string {
  const guardado = actividad.slug?.trim();
  if (guardado) return guardado;
  return slugifyNombreActividad(actividad.nombre) || "actividad";
}

export function rutaDetalleActividadAsistencia(
  actividad: Pick<ActividadRecord, "slug" | "nombre">,
): string {
  return `/siget/gestion-territorial/asistencia-actividades/${slugActividadDesdeRecord(actividad)}`;
}

export function rutaPublicaActividadAsistencia(
  actividad: Pick<ActividadRecord, "slug" | "nombre">,
): string {
  return `/actividades/${slugActividadDesdeRecord(actividad)}`;
}
