import type {
  DocumentChannel,
  DocumentListItem,
  DocumentStatus,
  PublicCanalSlug,
  CountryScope,
  ProgramEnum,
  DocumentType,
  AccessLevel,
  SortOption,
  ActividadEvento,
  NoticiaContent,
  NoticiaSeccion,
} from "./zod";
import {
  DOCUMENT_CHANNELS,
  PUBLIC_CANAL_SLUGS,
  DOCUMENT_TYPES,
  COUNTRY_SCOPES,
  PROGRAMS,
  ACCESS_LEVELS,
  SORT_OPTIONS,
  NOTICIA_CONTENT_KIND,
  NOTICIA_GALERIA_MAX,
  noticiaContentSchema,
} from "./zod";
import { normalizarVideoNoticia } from "./noticia-video";
import { esNoticiaAspectId } from "./noticia-imagen";

const CHANNEL_TO_CANAL: Record<
  Exclude<DocumentChannel, "normativo_interno">,
  PublicCanalSlug
> = {
  noticia: "noticias",
  cientifico: "cientifico",
  educativo: "educativo",
};

const CANAL_TO_CHANNEL: Partial<Record<PublicCanalSlug, DocumentChannel>> = {
  noticias: "noticia",
  cientifico: "cientifico",
  educativo: "educativo",
};

export function isLibraryAdminRole(role: string): boolean {
  const normalized = role.toLowerCase().trim();
  return normalized === "admin" || normalized === "super";
}

export function canalDesdeChannel(
  channel: DocumentChannel,
): PublicCanalSlug | null {
  if (channel === "normativo_interno") return null;
  return CHANNEL_TO_CANAL[channel];
}

export function channelDesdeCanal(canal: string): DocumentChannel | null {
  if (!esCanalPublico(canal)) return null;
  return CANAL_TO_CHANNEL[canal] ?? null;
}

export function esCanalDocumentos(canal: string | null | undefined): boolean {
  return canal === "documentos";
}

export function puedeEditarDocumento(
  doc: {
    created_by: string | null;
    publishing_status: DocumentStatus;
  },
  userId: string | null | undefined,
  role: string,
): boolean {
  if (isLibraryAdminRole(role)) return true;
  if (!userId || doc.created_by !== userId) return false;
  return doc.publishing_status !== "aprobado";
}

export function puedeEditarAccesoDocumento(
  doc: {
    created_by: string | null;
    publishing_status: DocumentStatus;
    channel: DocumentChannel;
  },
  userId: string | null | undefined,
  role: string,
): boolean {
  if (doc.channel === "noticia" || doc.channel === "normativo_interno") {
    return false;
  }
  return puedeEditarDocumento(doc, userId, role);
}

export function esCanalPublico(value: string): value is PublicCanalSlug {
  return (PUBLIC_CANAL_SLUGS as readonly string[]).includes(value);
}

export function esChannel(value: string): value is DocumentChannel {
  return (DOCUMENT_CHANNELS as readonly string[]).includes(value);
}

export function rutaCatalogoCanal(canal?: PublicCanalSlug | null): string {
  if (!canal) return "/conocimiento";
  return `/conocimiento/${canal}`;
}

export function rutaDetalleDocumento(
  channel: DocumentChannel,
  slug: string,
): string | null {
  if (channel === "noticia") {
    return `/conocimiento/noticias/${encodeURIComponent(slug)}`;
  }
  if (channel === "normativo_interno") return null;
  return `/conocimiento/documentos/${encodeURIComponent(slug)}`;
}

export function segmentoListaRepositorio(
  channel: DocumentChannel,
): "noticias" | "documentos" {
  return channel === "noticia" ? "noticias" : "documentos";
}

export function rutaVerDocumento(
  slug: string,
  channel: DocumentChannel,
): string {
  return `/siget/repositorio/${segmentoListaRepositorio(channel)}/${encodeURIComponent(slug)}`;
}

export function rutaEditarDocumento(
  slug: string,
  channel: DocumentChannel,
): string {
  return `${rutaVerDocumento(slug, channel)}/editar`;
}

export function rutaRepositorioInicio(): string {
  return "/siget/repositorio";
}

export function rutaRepositorioNoticias(): string {
  return "/siget/repositorio/noticias";
}

export function rutaRepositorioNoticiasMis(): string {
  return rutaRepositorioNoticias();
}

export function rutaNuevaNoticia(): string {
  return "/siget/repositorio/noticias/nuevo";
}

export function rutaRepositorioDocumentos(): string {
  return "/siget/repositorio/documentos";
}

export function rutaRepositorioDocumentosMis(): string {
  return rutaRepositorioDocumentos();
}

export function rutaNuevoDocumento(): string {
  return "/siget/repositorio/documentos/nuevo";
}

export function slugifyEtiqueta(nombre: string): string {
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

export function eventosActividadDocumento(doc: {
  actividad: ActividadEvento[];
  created_at: string;
  created_by: string | null;
  created_by_nombre: string | null;
}): ActividadEvento[] {
  if (doc.actividad.length > 0) return doc.actividad;
  if (!doc.created_at) return [];
  return [
    {
      accion: "creacion",
      user_id: doc.created_by,
      nombre: doc.created_by_nombre?.trim() || "Usuario",
      at: doc.created_at,
    },
  ];
}

export function instanteUltimaActualizacion(doc: {
  actividad: ActividadEvento[];
  created_at: string;
}): string | null {
  const ultimo = doc.actividad[doc.actividad.length - 1]?.at;
  if (ultimo) return ultimo;
  return doc.created_at || null;
}

export function etiquetaActividad(
  accion: ActividadEvento["accion"],
  esUltimaModificacion: boolean,
): string {
  if (accion === "creacion") return "Creación";
  return esUltimaModificacion ? "Última modificación" : "Modificación";
}

export function nombreDesdeMetadata(
  meta: Record<string, unknown> | null | undefined,
  fallback = "",
): string {
  if (!meta) return fallback;
  const nombre = meta.nombre;
  const name = meta.name;
  if (typeof nombre === "string" && nombre.trim()) return nombre.trim();
  if (typeof name === "string" && name.trim()) return name.trim();
  return fallback;
}

export function seccionNoticiaVacia(): NoticiaSeccion {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    heading: "",
    body: "",
    image_slug: null,
    gallery_slugs: [],
    foto_aspect: null,
    video_url: null,
  };
}

export function slugsFotosSeccion(
  section: Pick<NoticiaSeccion, "image_slug" | "gallery_slugs">,
): string[] {
  const gallery = section.gallery_slugs ?? [];
  if (gallery.length > 0) return gallery.slice(0, NOTICIA_GALERIA_MAX);
  if (section.image_slug) return [section.image_slug];
  return [];
}

export function serializarNoticiaContent(content: NoticiaContent): string {
  return JSON.stringify({
    kind: NOTICIA_CONTENT_KIND,
    sections: content.sections.map((section) => {
      const gallerySlugs = slugsFotosSeccion(section);
      return {
        id: section.id,
        heading: section.heading.trim(),
        body: section.body.trim(),
        image_slug: gallerySlugs[0] ?? null,
        gallery_slugs: gallerySlugs,
        foto_aspect: esNoticiaAspectId(section.foto_aspect) ? section.foto_aspect : null,
        video_url: normalizarVideoNoticia(section.video_url),
      };
    }),
  });
}

export function esNoticiaSecciones(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{")) return false;
  try {
    return noticiaContentSchema.safeParse(JSON.parse(trimmed)).success;
  } catch {
    return false;
  }
}

export function parsearNoticiaContent(content: string): NoticiaContent {
  const trimmed = content.trim();
  if (!trimmed) {
    return { kind: NOTICIA_CONTENT_KIND, sections: [seccionNoticiaVacia()] };
  }
  try {
    const parsed = noticiaContentSchema.safeParse(JSON.parse(trimmed));
    if (parsed.success) {
      const sections =
        parsed.data.sections.length > 0
          ? parsed.data.sections
          : [seccionNoticiaVacia()];
      return { kind: NOTICIA_CONTENT_KIND, sections };
    }
  } catch {
    /* contenido legado */
  }
  return {
    kind: NOTICIA_CONTENT_KIND,
    sections: [
      {
        ...seccionNoticiaVacia(),
        body: htmlATexto(trimmed),
      },
    ],
  };
}

export function htmlATexto(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const CHANNEL_LABELS: Record<DocumentChannel, string> = {
  noticia: "Noticia",
  cientifico: "Científico",
  educativo: "Educativo",
  normativo_interno: "Normativo interno",
};

export const CANAL_LABELS: Record<PublicCanalSlug, string> = {
  noticias: "Noticias",
  documentos: "Documentos",
  cientifico: "Ciencia",
  educativo: "Educación",
};

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export const TYPE_LABELS: Record<DocumentType, string> = {
  nota: "Nota",
  comunicado: "Comunicado",
  articulo: "Artículo",
  informe: "Informe",
  estudio: "Estudio",
  manual: "Manual",
  guia: "Guía",
  infografia: "Infografía",
  presentacion: "Presentación",
  normativa: "Normativa",
  procedimiento: "Procedimiento",
  otro: "Otro",
};

export const COUNTRY_LABELS: Record<CountryScope, string> = {
  trinacional: "Trinacional",
  guatemala: "Guatemala",
  el_salvador: "El Salvador",
  honduras: "Honduras",
};

export const PROGRAM_LABELS: Record<ProgramEnum, string> = {
  desarrollo_social_economico: "Desarrollo social y económico",
  genero_juventud_pueblos_originarios: "Género, juventud y pueblos originarios",
  cambio_climatico_gestion_ambiental: "Cambio climático y gestión ambiental",
  gobernanza_institucionalidad: "Gobernanza e institucionalidad",
};

export const ACCESS_LABELS: Record<AccessLevel, string> = {
  public: "Público",
  interno: "Privado",
};

export const SORT_LABELS: Record<SortOption, string> = {
  fecha_desc: "Más recientes",
  fecha_asc: "Más antiguos",
  titulo_asc: "Título A-Z",
  titulo_desc: "Título Z-A",
  autor_asc: "Autor A-Z",
  cooperante_asc: "Cooperante A-Z",
  descargas_desc: "Más descargados",
};

export function optionsFromLabels<T extends string>(
  labels: Record<T, string>,
): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({
    value,
    label: labels[value],
  }));
}

export const CHANNEL_OPTIONS = optionsFromLabels(CHANNEL_LABELS);
export const CHANNEL_OPTIONS_DOCUMENTO = CHANNEL_OPTIONS.filter(
  (opt) => opt.value !== "noticia",
);
export const TYPE_OPTIONS = DOCUMENT_TYPES.map((value) => ({
  value,
  label: TYPE_LABELS[value],
}));
export const COUNTRY_OPTIONS = COUNTRY_SCOPES.map((value) => ({
  value,
  label: COUNTRY_LABELS[value],
}));
export const PROGRAM_OPTIONS = PROGRAMS.map((value) => ({
  value,
  label: PROGRAM_LABELS[value],
}));
export const ACCESS_OPTIONS = ACCESS_LEVELS.map((value) => ({
  value,
  label: ACCESS_LABELS[value],
}));
export const SORT_OPTION_LIST = SORT_OPTIONS.map((value) => ({
  value,
  label: SORT_LABELS[value],
}));

export function textoPlanoHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizarHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export const HOME_PREVIEW_SIMULADO_PREFIX = "home-simulado-";

const HOME_PREVIEW_SIMULADO_TITLES: Partial<Record<PublicCanalSlug, string[]>> =
  {
    noticias: [
      "Encuentro trifinio alinea seguimiento y acciones conjuntas",
      "Plan Trifinio impulsa diálogo con actores locales",
      "Comunicado sobre avances en la región fronteriza",
      "Crónica de jornada de trabajo en El Salvador",
      "Nota sobre cooperación en Guatemala y Honduras",
      "Balance institucional del trimestre en la región",
    ],
    educativo: [
      "Guía de buenas prácticas para formación comunitaria",
      "Manual de inducción al trabajo trifinio",
      "Curso abierto sobre gestión participativa",
      "Material didáctico para líderes locales",
      "Recursos para capacitación en territorio",
      "Apuntes de taller trinacional de aprendizaje",
    ],
    cientifico: [
      "Estudio sobre dinámicas socioeconómicas en la región",
      "Artículo técnico de monitoreo ambiental",
      "Informe de línea base trinacional",
      "Análisis de indicadores de desarrollo local",
      "Revisión de evidencia en proyectos fronterizos",
      "Síntesis científica para toma de decisiones",
    ],
  };

export function esHomePreviewSimulado(id: string): boolean {
  return id.startsWith(HOME_PREVIEW_SIMULADO_PREFIX);
}

function fechaSimuladaHomePreview(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function documentTypeSimulado(channel: DocumentChannel): DocumentType {
  if (channel === "noticia") return "comunicado";
  if (channel === "educativo") return "guia";
  return "articulo";
}

export function portadaSimuladaHomePreview(
  canal: PublicCanalSlug,
  index: number,
): string {
  const seed = encodeURIComponent(`siget-${canal}-${index}`);
  return `https://picsum.photos/seed/${seed}/800/800`;
}

export function seisSimuladosHomePreview(
  canal: PublicCanalSlug,
): DocumentListItem[] {
  const channel = channelDesdeCanal(canal);
  if (!channel) return [];
  const titulos = HOME_PREVIEW_SIMULADO_TITLES[canal] ?? [];
  const creado = fechaSimuladaHomePreview(0);

  return Array.from({ length: 6 }, (_, index) => ({
    id: `${HOME_PREVIEW_SIMULADO_PREFIX}${canal}-${index}`,
    slug: `preview-${canal}-${index}`,
    title: titulos[index] ?? `Ejemplo ${index + 1}`,
    summary: "<p>Vista previa de maquetación (rol super).</p>",
    channel,
    document_type: documentTypeSimulado(channel),
    country_scope: "trinacional",
    program: null,
    author: "Plan Trifinio",
    cooperante: "",
    publication_date: fechaSimuladaHomePreview(index * 4 + 1),
    download_count: 0,
    view_count: 0,
    created_at: creado,
    tags: [],
    cover_slug: portadaSimuladaHomePreview(canal, index),
  }));
}
