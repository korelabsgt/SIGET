import { z } from "zod";

export const DOCUMENT_STATUS = [
  "borrador",
  "en_revision",
  "aprobado",
  "rechazado",
] as const;

export const DOCUMENT_CHANNELS = [
  "noticia",
  "cientifico",
  "educativo",
  "normativo_interno",
] as const;

export const PUBLIC_CANAL_SLUGS = [
  "noticias",
  "documentos",
  "cientifico",
  "educativo",
] as const;

export const DOCUMENT_TYPES = [
  "nota",
  "comunicado",
  "articulo",
  "informe",
  "estudio",
  "manual",
  "guia",
  "infografia",
  "presentacion",
  "normativa",
  "procedimiento",
  "otro",
] as const;

export const COUNTRY_SCOPES = [
  "trinacional",
  "guatemala",
  "el_salvador",
  "honduras",
] as const;

export const PROGRAMS = [
  "desarrollo_social_economico",
  "genero_juventud_pueblos_originarios",
  "cambio_climatico_gestion_ambiental",
  "gobernanza_institucionalidad",
] as const;

export const ACCESS_LEVELS = ["public", "interno"] as const;

export const FILE_KINDS = ["adjunto", "imagen"] as const;

export const NOTICIA_CONTENT_KIND = "noticia_secciones" as const;

export const SORT_OPTIONS = [
  "fecha_desc",
  "fecha_asc",
  "titulo_asc",
  "titulo_desc",
  "autor_asc",
  "cooperante_asc",
  "descargas_desc",
] as const;

export const fechaCalendarioSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const documentStatusSchema = z.enum(DOCUMENT_STATUS);
export const documentChannelSchema = z.enum(DOCUMENT_CHANNELS);
export const publicCanalSlugSchema = z.enum(PUBLIC_CANAL_SLUGS);
export const documentTypeSchema = z.enum(DOCUMENT_TYPES);
export const countryScopeSchema = z.enum(COUNTRY_SCOPES);
export const programSchema = z.enum(PROGRAMS);
export const accessLevelSchema = z.enum(ACCESS_LEVELS);
export const fileKindSchema = z.enum(FILE_KINDS);
export const sortOptionSchema = z.enum(SORT_OPTIONS);

export const documentFormSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  summary: z.string().trim().max(2000).default(""),
  content: z.string().default(""),
  channel: documentChannelSchema,
  document_type: documentTypeSchema,
  country_scope: countryScopeSchema,
  program: programSchema.nullable().optional(),
  access_level: accessLevelSchema.default("public"),
  author: z.string().trim().min(1, "Indique el autor").max(200),
  cooperante: z.string().trim().max(200).default(""),
  publication_date: fechaCalendarioSchema,
  version: z.string().trim().max(40).default("1"),
  tag_ids: z.array(z.string().uuid()).default([]),
  submit_for_review: z.boolean().default(false),
});

export const documentFilterParamsSchema = z.object({
  query: z.string().trim().optional().default(""),
  channel: documentChannelSchema.optional(),
  canal: publicCanalSlugSchema.optional(),
  tag_slugs: z.array(z.string().trim().min(1)).default([]),
  country_scope: countryScopeSchema.optional(),
  program: programSchema.optional(),
  sort: sortOptionSchema.default("fecha_desc"),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(50).default(12),
});

export const rejectDocumentSchema = z.object({
  slug: z.string().trim().min(1),
  reason: z.string().trim().min(1, "Indique el motivo del rechazo").max(500),
});

export const updateAccessLevelSchema = z.object({
  slug: z.string().trim().min(1),
  access_level: accessLevelSchema,
});

export const createTagSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(60),
});

export const NOTICIA_GALERIA_MAX = 6;

export const noticiaSeccionSchema = z.object({
  id: z.string().trim().min(1),
  heading: z.string().trim().max(200).default(""),
  body: z.string().trim().max(20000).default(""),
  image_slug: z.string().trim().min(1).nullable().default(null),
  gallery_slugs: z.array(z.string().trim().min(1)).max(NOTICIA_GALERIA_MAX).default([]),
  foto_aspect: z.string().trim().max(20).nullable().default(null),
  video_url: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
});

export const noticiaContentSchema = z.object({
  kind: z.literal(NOTICIA_CONTENT_KIND),
  sections: z.array(noticiaSeccionSchema).max(30),
});

export const registrarArchivoSchema = z.object({
  document_id: z.string().uuid(),
  kind: fileKindSchema,
  file_path: z.string().trim().min(1),
  original_name: z.string().trim().min(1),
  mime_type: z.string().trim().min(1),
  file_size_bytes: z.number().int().min(0),
  sort_order: z.number().int().min(0).default(0),
});

export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type DocumentChannel = z.infer<typeof documentChannelSchema>;
export type PublicCanalSlug = z.infer<typeof publicCanalSlugSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type CountryScope = z.infer<typeof countryScopeSchema>;
export type ProgramEnum = z.infer<typeof programSchema>;
export type AccessLevel = z.infer<typeof accessLevelSchema>;
export type FileKind = z.infer<typeof fileKindSchema>;
export type SortOption = z.infer<typeof sortOptionSchema>;
export type DocumentFormValues = z.infer<typeof documentFormSchema>;
export type DocumentFilterParams = z.infer<typeof documentFilterParamsSchema>;
export type RejectDocumentValues = z.infer<typeof rejectDocumentSchema>;
export type UpdateAccessLevelValues = z.infer<typeof updateAccessLevelSchema>;
export type CreateTagValues = z.infer<typeof createTagSchema>;
export type RegistrarArchivoValues = z.infer<typeof registrarArchivoSchema>;
export type NoticiaSeccion = z.infer<typeof noticiaSeccionSchema>;
export type NoticiaContent = z.infer<typeof noticiaContentSchema>;

export type TagRecord = {
  id: string;
  name: string;
  slug: string;
};

export type ActividadAccion = "creacion" | "modificacion";

export type ActividadEvento = {
  accion: ActividadAccion;
  user_id: string | null;
  nombre: string;
  at: string;
};

export type DocumentFileRecord = {
  id: string;
  document_id: string;
  slug: string;
  kind: FileKind;
  file_path: string;
  original_name: string;
  mime_type: string;
  file_size_bytes: number;
  download_count: number;
  sort_order: number;
  created_at: string;
};

export type DocumentRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  channel: DocumentChannel;
  document_type: DocumentType;
  country_scope: CountryScope;
  program: ProgramEnum | null;
  access_level: AccessLevel;
  publishing_status: DocumentStatus;
  author: string;
  cooperante: string;
  publication_date: string;
  version: string;
  download_count: number;
  view_count: number;
  created_by: string | null;
  created_by_nombre: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string | null;
  actividad: ActividadEvento[];
  tags: TagRecord[];
  files: DocumentFileRecord[];
};

export type DocumentListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  channel: DocumentChannel;
  document_type: DocumentType;
  country_scope: CountryScope;
  program: ProgramEnum | null;
  author: string;
  cooperante: string;
  publication_date: string;
  download_count: number;
  view_count: number;
  publishing_status?: DocumentStatus;
  created_at: string;
  tags: TagRecord[];
  cover_slug?: string | null;
};

export type DocumentSearchResult = {
  items: DocumentListItem[];
  total: number;
  page: number;
  page_size: number;
};
