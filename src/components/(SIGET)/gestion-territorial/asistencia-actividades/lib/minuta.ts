import type { ActividadRecord } from "./zod";

export type MinutaMencionTipo = "usuario" | "departamento" | "puesto";

export type MinutaMencion = {
  tipo: MinutaMencionTipo;
  id: string;
  nombre: string;
};

export type MinutaAnexoTipo = "imagen" | "pdf" | "enlace";

export type MinutaAnexo = {
  id: string;
  tipo: MinutaAnexoTipo;
  titulo: string;
  url: string;
  bucket: string | null;
  path: string | null;
  nombreArchivo: string | null;
  mime: string | null;
  tamano: number | null;
};

export type MinutaAcuerdo = {
  id: string;
  titulo: string;
  responsablesTexto: string;
  responsables: MinutaMencion[];
  items: string[];
};

export type MinutaActividadBloque = {
  id: string;
  titulo: string;
  items: string[];
};

export type MinutaEstado = "borrador" | "finalizada";

export type MinutaRecord = {
  id: string | null;
  actividadId: string;
  fecha: string;
  actividadNombre: string;
  institucion: string;
  elaboro: string;
  estado: MinutaEstado;
  introduccion: string;
  actividadesRealizadas: MinutaActividadBloque[];
  acuerdos: MinutaAcuerdo[];
  compromisosGenerales: string;
  anexosNota: string;
  anexos: MinutaAnexo[];
  updatedAt: string;
};

export const MINUTA_ANEXOS_BUCKET = "minutas-anexos";

export const MINUTA_MENCION_TIPOS: MinutaMencionTipo[] = [
  "usuario",
  "departamento",
  "puesto",
];

export const MINUTA_MENCION_ETIQUETA: Record<MinutaMencionTipo, string> = {
  usuario: "Usuario",
  departamento: "Dependencia",
  puesto: "Puesto",
};

export function nuevoActividadBloqueId(): string {
  return `act-bloque-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function nuevoAcuerdoId(): string {
  return `acuerdo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function nuevoAnexoId(): string {
  return `anexo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function crearActividadBloqueVacio(): MinutaActividadBloque {
  return {
    id: nuevoActividadBloqueId(),
    titulo: "",
    items: [""],
  };
}

export function componerMencionId(
  tipo: MinutaMencionTipo,
  id: string,
): string {
  return `${tipo}:${id}`;
}

export function parsearMencionId(
  valor: string,
): { tipo: MinutaMencionTipo; id: string } | null {
  const separador = valor.indexOf(":");
  if (separador === -1) return null;
  const tipo = valor.slice(0, separador) as MinutaMencionTipo;
  const id = valor.slice(separador + 1);
  if (!MINUTA_MENCION_TIPOS.includes(tipo) || !id) return null;
  return { tipo, id };
}

/**
 * Lee las menciones directamente del HTML del editor. Solo reconoce nodos
 * `data-type="mention"` con un `data-id` válido, así que el texto suelto que
 * empiece con @ nunca se convierte en responsable.
 */
export function extraerMenciones(html: string): MinutaMencion[] {
  const encontradas: MinutaMencion[] = [];
  const vistos = new Set<string>();
  const nodos = html.matchAll(/<span[^>]*data-type="mention"[^>]*>/gi);

  for (const [nodo] of nodos) {
    const idAttr = nodo.match(/data-id="([^"]*)"/i)?.[1];
    if (!idAttr) continue;
    const referencia = parsearMencionId(decodeHtmlAttr(idAttr));
    if (!referencia) continue;
    const clave = componerMencionId(referencia.tipo, referencia.id);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    const label = nodo.match(/data-label="([^"]*)"/i)?.[1] ?? "";
    encontradas.push({
      tipo: referencia.tipo,
      id: referencia.id,
      nombre: decodeHtmlAttr(label),
    });
  }

  return encontradas;
}

function decodeHtmlAttr(valor: string): string {
  return valor
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function crearMinutaVacia(actividad: ActividadRecord): MinutaRecord {
  return {
    id: null,
    actividadId: actividad.id,
    fecha: actividad.fecha_realizacion,
    actividadNombre: actividad.nombre,
    institucion: "Comisión Trinacional del Plan Trifinio",
    elaboro: "",
    estado: "borrador",
    introduccion: "",
    actividadesRealizadas: [crearActividadBloqueVacio()],
    acuerdos: [],
    compromisosGenerales: "",
    anexosNota: "",
    anexos: [],
    updatedAt: new Date().toISOString(),
  };
}

export function htmlATexto(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function minutaTieneContenido(minuta: MinutaRecord): boolean {
  return (
    htmlATexto(minuta.introduccion).length > 0 ||
    minuta.elaboro.trim().length > 0 ||
    minuta.actividadesRealizadas.some(
      (bloque) =>
        bloque.titulo.trim().length > 0 ||
        bloque.items.some((item) => htmlATexto(item).length > 0),
    ) ||
    minuta.acuerdos.length > 0 ||
    htmlATexto(minuta.compromisosGenerales).length > 0 ||
    htmlATexto(minuta.anexosNota).length > 0 ||
    minuta.anexos.length > 0
  );
}

export function esAnexoImagen(anexo: MinutaAnexo): boolean {
  return anexo.tipo === "imagen";
}

export function anexoEtiquetaTipo(tipo: MinutaAnexoTipo): string {
  if (tipo === "imagen") return "Fotografía";
  if (tipo === "pdf") return "PDF";
  return "Enlace";
}

/** Normaliza un href escrito a mano para que siempre sea navegable. */
export function normalizarEnlace(valor: string): string {
  const limpio = valor.trim();
  if (!limpio) return "";
  if (/^https?:\/\//i.test(limpio)) return limpio;
  if (/^www\./i.test(limpio)) return `https://${limpio}`;
  return `https://${limpio}`;
}

export function esEnlaceValido(valor: string): boolean {
  const normalizado = normalizarEnlace(valor);
  if (!normalizado) return false;
  try {
    const url = new URL(normalizado);
    return Boolean(url.hostname) && url.hostname.includes(".");
  } catch {
    return false;
  }
}

const VISTA_KEY = "siget-minuta-vista";

export function loadVistaMinuta(actividadId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(VISTA_KEY);
    if (!raw) return false;
    const all = JSON.parse(raw) as Record<string, boolean>;
    return all[actividadId] === true;
  } catch {
    return false;
  }
}

export function saveVistaMinuta(actividadId: string, abierta: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(VISTA_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    if (abierta) {
      all[actividadId] = true;
    } else {
      delete all[actividadId];
    }
    sessionStorage.setItem(VISTA_KEY, JSON.stringify(all));
  } catch {
    return;
  }
}

export function resumenAcuerdos(minuta: MinutaRecord, limite = 3): string[] {
  return minuta.acuerdos
    .filter(
      (a) =>
        htmlATexto(a.titulo).length > 0 ||
        a.items.some((i) => htmlATexto(i).length > 0),
    )
    .slice(0, limite)
    .map(
      (a) =>
        htmlATexto(a.titulo) ||
        htmlATexto(a.responsablesTexto) ||
        "Sin título",
    );
}
