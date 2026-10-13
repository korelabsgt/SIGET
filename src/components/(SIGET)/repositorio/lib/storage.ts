export const LIBRARY_BUCKET = "repositorio-documentos";
export const LIBRARY_MAX_BYTES = 25 * 1024 * 1024;

export function rutaStorageArchivo(
  userId: string,
  documentId: string,
  fileId: string,
  originalName: string,
): string {
  const safe = originalName.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "archivo";
  return `${userId}/${documentId}/${fileId}/${safe}`;
}

export function esImagenMime(mime: string | null | undefined): boolean {
  return (mime ?? "").toLowerCase().startsWith("image/");
}

export function esPdfMime(mime: string | null | undefined): boolean {
  return (mime ?? "").toLowerCase() === "application/pdf";
}

export function kindDesdeMime(mime: string): "adjunto" | "imagen" {
  return esImagenMime(mime) ? "imagen" : "adjunto";
}

export function pesoArchivoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function rutaVisorArchivo(slug: string): string {
  return `/conocimiento/archivo/${encodeURIComponent(slug)}`;
}

export function rutaRawArchivo(slug: string, descargar = false): string {
  const base = `/conocimiento/archivo/${encodeURIComponent(slug)}/raw`;
  return descargar ? `${base}?dl=1` : base;
}

export function portadaListItemSrc(
  cover_slug: string | null | undefined,
): string | null {
  if (!cover_slug) return null;
  if (/^https?:\/\//i.test(cover_slug)) return cover_slug;
  return rutaRawArchivo(cover_slug);
}
