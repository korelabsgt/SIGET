export const ACT_ARCHIVOS_BUCKET = {
  privado: "act-archivos-privados",
  publico: "act-archivos-publicos",
} as const;

export const ACT_ARCHIVOS_MAX_BYTES = 10 * 1024 * 1024;
export const ACT_ARCHIVOS_MAX_POR_PESTANA = 5;

export type ArchivoVisibilidad = "privado" | "publico";
export type ArchivoTipo = "carpeta" | "archivo" | "enlace";

export type ArchivoNodo = {
  id: string;
  actividad_id: string;
  parent_id: string | null;
  visibilidad: ArchivoVisibilidad;
  tipo: ArchivoTipo;
  nombre: string;
  descripcion: string | null;
  bucket: string | null;
  path: string | null;
  url: string | null;
  nombre_archivo: string | null;
  mime: string | null;
  tamano: number | null;
  token_publico: string | null;
  created_at: string;
};

export type ArchivoArbol = ArchivoNodo & { hijos: ArchivoArbol[] };

export type ArchivosPorToken = {
  alcance: "actividad" | "carpeta" | "archivo";
  actividad: {
    id: string;
    nombre: string;
    fecha_realizacion: string;
    direccion: string;
    departamento: string;
    municipio: string;
  };
  nodo: ArchivoNodo | null;
  nodos: ArchivoNodo[];
  urls: Record<string, string>;
};

export function bucketArchivos(visibilidad: ArchivoVisibilidad): string {
  return visibilidad === "publico"
    ? ACT_ARCHIVOS_BUCKET.publico
    : ACT_ARCHIVOS_BUCKET.privado;
}

export function sanitizarNombreArchivo(nombre: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return (base || "archivo").slice(0, 120);
}

export function rutaStorageArchivo(args: {
  fecha: string;
  actividadId: string;
  nodoId: string;
  nombreArchivo: string;
}): string {
  const fecha = args.fecha.slice(0, 10);
  const nombre = sanitizarNombreArchivo(args.nombreArchivo);
  return `${fecha}/${args.actividadId}/${args.nodoId}/${nombre}`;
}

export function pesoArchivoLegible(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function esImagenMime(mime: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}

export function esPdfMime(mime: string | null): boolean {
  return mime === "application/pdf";
}

export function esItemArchivo(nodo: Pick<ArchivoNodo, "tipo">): boolean {
  return nodo.tipo === "archivo" || nodo.tipo === "enlace";
}

export function contarArchivosPestana(nodos: ArchivoNodo[]): number {
  return nodos.filter(esItemArchivo).length;
}

export function nuevoTokenArchivo(prefix: "a" | "n"): string {
  return `${prefix}${crypto.randomUUID().replace(/-/g, "")}`;
}

export function slugNombreArchivoPublico(nombre: string): string {
  const sinExt = nombre.replace(/\.[^.]+$/, "") || nombre;
  const slug = sinExt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "archivo";
}

export function tokenPublicoEsLegado(token: string): boolean {
  return /^n[0-9a-f]{32}$/i.test(token);
}

export function tokenPublicoDesdeNombre(nombre: string): string {
  const codigo = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
  return `${slugNombreArchivoPublico(nombre)}-${codigo}`;
}

export function armarArbolArchivos(nodos: ArchivoNodo[]): ArchivoArbol[] {
  const map = new Map<string, ArchivoArbol>();
  for (const n of nodos) {
    map.set(n.id, { ...n, hijos: [] });
  }

  const roots: ArchivoArbol[] = [];
  for (const n of nodos) {
    const node = map.get(n.id);
    if (!node) continue;
    if (n.parent_id && map.has(n.parent_id)) {
      map.get(n.parent_id)!.hijos.push(node);
    } else {
      roots.push(node);
    }
  }

  const ordenar = (items: ArchivoArbol[]) => {
    items.sort((a, b) => {
      if (a.tipo !== b.tipo) return a.tipo === "carpeta" ? -1 : 1;
      return a.nombre.localeCompare(b.nombre, "es");
    });
    for (const item of items) ordenar(item.hijos);
  };
  ordenar(roots);
  return roots;
}

export function idsSubarbol(nodos: ArchivoNodo[], raizId: string): string[] {
  const ids = new Set<string>([raizId]);
  let crecio = true;
  while (crecio) {
    crecio = false;
    for (const n of nodos) {
      if (n.parent_id && ids.has(n.parent_id) && !ids.has(n.id)) {
        ids.add(n.id);
        crecio = true;
      }
    }
  }
  return [...ids];
}

export function nodosDeCarpeta(
  nodos: ArchivoNodo[],
  carpetaId: string,
): ArchivoNodo[] {
  const ids = new Set(idsSubarbol(nodos, carpetaId));
  return nodos.filter((n) => ids.has(n.id));
}
