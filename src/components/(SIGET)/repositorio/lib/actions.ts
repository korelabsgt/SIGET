"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createPublicClient } from "@/utils/supabase/public";
import { createAdminClient } from "@/utils/supabase/admin";
import { normalizarFechaCalendario } from "@/lib/fechas-gt";
import {
  documentFormSchema,
  documentFilterParamsSchema,
  rejectDocumentSchema,
  updateAccessLevelSchema,
  registrarArchivoSchema,
  createTagSchema,
  documentChannelSchema,
  documentTypeSchema,
  countryScopeSchema,
  programSchema,
  accessLevelSchema,
  documentStatusSchema,
  fileKindSchema,
  type DocumentFormValues,
  type DocumentFilterParams,
  type DocumentRecord,
  type DocumentListItem,
  type DocumentSearchResult,
  type DocumentFileRecord,
  type TagRecord,
  type ActividadEvento,
  type DocumentChannel,
} from "./zod";
import {
  channelDesdeCanal,
  esCanalDocumentos,
  isLibraryAdminRole,
  puedeEditarAccesoDocumento,
  slugifyEtiqueta,
} from "./helpers";
import { LIBRARY_BUCKET, esImagenMime, esPdfMime } from "./storage";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ActionResult = { success: boolean; error: string | null };
type ActionResultWithSlug = ActionResult & { slug?: string; id?: string };

type AuthOk = {
  supabase: SupabaseServerClient;
  user: { id: string; role: string };
  error: null;
};

type AuthFail = {
  supabase: null;
  user: null;
  error: string;
};

async function requireAuth(): Promise<AuthOk | AuthFail> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null, error: "UNAUTHORIZED" };
  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";
  return { supabase, user: { id: user.id, role }, error: null };
}

async function requireAdmin(): Promise<AuthOk | AuthFail> {
  const auth = await requireAuth();
  if (auth.error || !auth.user || !auth.supabase) {
    return { supabase: null, user: null, error: auth.error ?? "UNAUTHORIZED" };
  }
  if (!isLibraryAdminRole(auth.user.role)) {
    return { supabase: null, user: null, error: "FORBIDDEN" };
  }
  return auth;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value : String(value);
}

function parseChannel(value: unknown): DocumentChannel {
  const parsed = documentChannelSchema.safeParse(value);
  return parsed.success ? parsed.data : "noticia";
}

function normalizarTag(row: Record<string, unknown>): TagRecord | null {
  const id = asString(row.id);
  const slug = asString(row.slug);
  const name = asString(row.name);
  if (!id || !slug) return null;
  return { id, slug, name };
}

function normalizarArchivo(row: Record<string, unknown>): DocumentFileRecord {
  const kindParsed = fileKindSchema.safeParse(row.kind);
  return {
    id: asString(row.id),
    document_id: asString(row.document_id),
    slug: asString(row.slug),
    kind: kindParsed.success ? kindParsed.data : "adjunto",
    file_path: asString(row.file_path),
    original_name: asString(row.original_name),
    mime_type: asString(row.mime_type),
    file_size_bytes: Number(row.file_size_bytes ?? 0),
    download_count: Number(row.download_count ?? 0),
    sort_order: Number(row.sort_order ?? 0),
    created_at: asString(row.created_at),
  };
}

function extraerNombreCreador(row: Record<string, unknown>): string | null {
  const direct = asString(row.created_by_nombre).trim();
  if (direct) return direct;
  const nested = row.creador;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const nombre = asString((nested as Record<string, unknown>).nombre).trim();
    if (nombre) return nombre;
  }
  return null;
}

function extraerTags(row: Record<string, unknown>): TagRecord[] {
  const raw = row.document_tags;
  if (!Array.isArray(raw)) return [];
  const tags: TagRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const nested = (item as { tags?: unknown }).tags;
    if (nested && typeof nested === "object") {
      const tag = normalizarTag(nested as Record<string, unknown>);
      if (tag) tags.push(tag);
    }
  }
  return tags;
}

async function attachCreadores(
  supabase: ReturnType<typeof createPublicClient> | SupabaseServerClient,
  docs: DocumentRecord[],
): Promise<DocumentRecord[]> {
  const ids = [
    ...new Set(docs.map((doc) => doc.created_by).filter((id): id is string => Boolean(id))),
  ];
  if (ids.length === 0) return docs;
  const { data } = await supabase.from("profiles").select("id, nombre").in("id", ids);
  const nombres = new Map<string, string>();
  for (const row of data ?? []) {
    const rec = row as Record<string, unknown>;
    const id = asString(rec.id);
    const nombre = asString(rec.nombre).trim();
    if (id && nombre) nombres.set(id, nombre);
  }
  return docs.map((doc) => ({
    ...doc,
    created_by_nombre: doc.created_by
      ? nombres.get(doc.created_by) ?? doc.created_by_nombre
      : null,
  }));
}

async function attachPortadas(
  supabase: ReturnType<typeof createPublicClient> | SupabaseServerClient,
  items: DocumentListItem[],
): Promise<DocumentListItem[]> {
  if (items.length === 0) return items;
  const ids = items.map((item) => item.id);
  const { data } = await supabase
    .from("library_document_files")
    .select("document_id, slug, kind, sort_order")
    .in("document_id", ids)
    .eq("kind", "imagen")
    .order("sort_order", { ascending: true });
  const first = new Map<string, string>();
  for (const row of data ?? []) {
    const rec = row as Record<string, unknown>;
    const docId = asString(rec.document_id);
    const slug = asString(rec.slug);
    if (!docId || !slug || first.has(docId)) continue;
    first.set(docId, slug);
  }
  return items.map((item) => ({
    ...item,
    cover_slug: first.get(item.id) ?? null,
  }));
}

function extraerArchivos(row: Record<string, unknown>): DocumentFileRecord[] {
  const raw = row.library_document_files;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map(normalizarArchivo)
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
}

function normalizarDocumento(row: Record<string, unknown>): DocumentRecord {
  const typeParsed = documentTypeSchema.safeParse(row.document_type);
  const countryParsed = countryScopeSchema.safeParse(row.country_scope);
  const programParsed = programSchema.safeParse(row.program);
  const accessParsed = accessLevelSchema.safeParse(row.access_level);
  const statusParsed = documentStatusSchema.safeParse(row.publishing_status);
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    title: asString(row.title),
    summary: asString(row.summary),
    content: asString(row.content),
    channel: parseChannel(row.channel),
    document_type: typeParsed.success ? typeParsed.data : "otro",
    country_scope: countryParsed.success ? countryParsed.data : "trinacional",
    program: programParsed.success ? programParsed.data : null,
    access_level: accessParsed.success ? accessParsed.data : "public",
    publishing_status: statusParsed.success ? statusParsed.data : "borrador",
    author: asString(row.author),
    cooperante: asString(row.cooperante),
    publication_date: normalizarFechaCalendario(asString(row.publication_date)),
    version: asString(row.version, "1"),
    download_count: Number(row.download_count ?? 0),
    view_count: Number(row.view_count ?? 0),
    created_by: asNullableString(row.created_by),
    created_by_nombre: extraerNombreCreador(row),
    approved_by: asNullableString(row.approved_by),
    rejection_reason: asNullableString(row.rejection_reason),
    created_at: asString(row.created_at),
    updated_at: asNullableString(row.updated_at),
    actividad: parsearActividad(row.actividad),
    tags: extraerTags(row),
    files: extraerArchivos(row),
  };
}

const DOCUMENT_SELECT = `
  id, slug, title, summary, content, channel, document_type, country_scope,
  program, access_level, publishing_status, author, cooperante, publication_date,
  version, download_count, view_count, created_by, approved_by, rejection_reason,
  created_at, updated_at,
  document_tags ( tags ( id, name, slug ) ),
  library_document_files ( * )
`;

const DOCUMENT_SELECT_PRIVADO = `${DOCUMENT_SELECT}, actividad`;
const DOCUMENT_SELECT_PUBLICO = DOCUMENT_SELECT_PRIVADO;

const ACTIVIDAD_MAX = 80;

function parsearActividad(raw: unknown): ActividadEvento[] {
  if (!Array.isArray(raw)) return [];
  const eventos: ActividadEvento[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const accion = rec.accion === "creacion" || rec.accion === "modificacion" ? rec.accion : null;
    const at = asString(rec.at);
    if (!accion || !at) continue;
    eventos.push({
      accion,
      user_id: asNullableString(rec.user_id),
      nombre: asString(rec.nombre).trim(),
      at,
    });
  }
  return eventos;
}

async function nombreCompletoUsuario(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string> {
  const { data } = await supabase.from("profiles").select("nombre").eq("id", userId).maybeSingle();
  const nombre = asString((data as { nombre?: unknown } | null)?.nombre).trim();
  return nombre || "Usuario";
}

function semillaActividad(actual: DocumentRecord): ActividadEvento[] {
  if (actual.actividad.length > 0) return actual.actividad;
  if (!actual.created_at) return [];
  return [
    {
      accion: "creacion",
      user_id: actual.created_by,
      nombre: actual.created_by_nombre?.trim() || "Usuario",
      at: actual.created_at,
    },
  ];
}

async function actividadConEvento(
  supabase: SupabaseServerClient,
  previa: ActividadEvento[],
  userId: string,
  accion: ActividadEvento["accion"],
): Promise<ActividadEvento[]> {
  const nombre = await nombreCompletoUsuario(supabase, userId);
  return [
    ...previa,
    {
      accion,
      user_id: userId,
      nombre,
      at: new Date().toISOString(),
    },
  ].slice(-ACTIVIDAD_MAX);
}

async function anexarActividad(
  supabase: SupabaseServerClient,
  documentId: string,
  userId: string,
  previa: ActividadEvento[],
): Promise<string | null> {
  const actividad = await actividadConEvento(supabase, previa, userId, "modificacion");
  const { error } = await supabase
    .from("library_documents")
    .update({ actividad })
    .eq("id", documentId);
  return error ? "SAVE_FAILED" : null;
}

function payloadFromForm(
  values: DocumentFormValues,
  createdBy?: string,
): Record<string, unknown> {
  const access =
    values.channel === "normativo_interno" ? "interno" : values.access_level;
  const status = values.submit_for_review ? "en_revision" : "borrador";
  return {
    title: values.title,
    summary: values.summary,
    content: values.content,
    channel: values.channel,
    document_type: values.document_type,
    country_scope: values.country_scope,
    program: values.program ?? null,
    access_level: access,
    publishing_status: status,
    author: values.author,
    cooperante: values.cooperante,
    publication_date: normalizarFechaCalendario(values.publication_date),
    version: values.version || "1",
    ...(createdBy ? { created_by: createdBy } : {}),
  };
}

async function replaceTags(
  supabase: SupabaseServerClient,
  documentId: string,
  tagIds: string[],
): Promise<string | null> {
  const { error: delError } = await supabase
    .from("document_tags")
    .delete()
    .eq("document_id", documentId);
  if (delError) return "SAVE_FAILED";
  const unique = [...new Set(tagIds)];
  if (unique.length === 0) return null;
  const { error: insError } = await supabase.from("document_tags").insert(
    unique.map((tag_id) => ({ document_id: documentId, tag_id })),
  );
  if (insError) return "SAVE_FAILED";
  return null;
}

export async function getTags(): Promise<TagRecord[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("tags")
      .select("id, name, slug")
      .order("name");
    if (error || !data) return [];
    return data
      .map((row) => normalizarTag(row as Record<string, unknown>))
      .filter((tag): tag is TagRecord => tag !== null);
  } catch {
    return [];
  }
}

export async function createTagAction(
  values: { name: string },
): Promise<ActionResult & { tag?: TagRecord }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "UNAUTHORIZED" };
  }
  const parsed = createTagSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };
  const name = parsed.data.name;
  const slug = slugifyEtiqueta(name);
  if (!slug) return { success: false, error: "INVALID_INPUT" };

  try {
    const admin = createAdminClient();
    const { data: bySlug, error: slugError } = await admin
      .from("tags")
      .select("id, name, slug")
      .eq("slug", slug)
      .maybeSingle();
    if (slugError) return { success: false, error: "DB_ERROR" };
    if (bySlug) {
      const tag = normalizarTag(bySlug as Record<string, unknown>);
      return { success: false, error: "DUPLICATE", tag: tag ?? undefined };
    }
    const { data: byName, error: nameError } = await admin
      .from("tags")
      .select("id, name, slug")
      .ilike("name", name)
      .maybeSingle();
    if (nameError) return { success: false, error: "DB_ERROR" };
    if (byName) {
      const tag = normalizarTag(byName as Record<string, unknown>);
      return { success: false, error: "DUPLICATE", tag: tag ?? undefined };
    }
    const { data, error } = await admin
      .from("tags")
      .insert({ name, slug })
      .select("id, name, slug")
      .single();
    if (error) {
      if (error.code === "23505") return { success: false, error: "DUPLICATE" };
      return { success: false, error: "DB_ERROR" };
    }
    const tag = normalizarTag(data as Record<string, unknown>);
    if (!tag) return { success: false, error: "DB_ERROR" };
    return { success: true, error: null, tag };
  } catch {
    return { success: false, error: "DB_ERROR" };
  }
}

async function attachTagsToItems(
  supabase: ReturnType<typeof createPublicClient> | SupabaseServerClient,
  items: DocumentListItem[],
): Promise<DocumentListItem[]> {
  if (items.length === 0) return items;
  const ids = items.map((item) => item.id);
  const { data } = await supabase
    .from("document_tags")
    .select("document_id, tags ( id, name, slug )")
    .in("document_id", ids);
  const byDoc = new Map<string, TagRecord[]>();
  for (const row of data ?? []) {
    const rec = row as unknown as Record<string, unknown>;
    const docId = asString(rec.document_id);
    const tag = rec.tags && typeof rec.tags === "object"
      ? normalizarTag(rec.tags as Record<string, unknown>)
      : null;
    if (!docId || !tag) continue;
    const list = byDoc.get(docId) ?? [];
    list.push(tag);
    byDoc.set(docId, list);
  }
  return items.map((item) => ({
    ...item,
    tags: byDoc.get(item.id) ?? [],
  }));
}

function listItemFromRow(row: Record<string, unknown>): DocumentListItem {
  const typeParsed = documentTypeSchema.safeParse(row.document_type);
  const countryParsed = countryScopeSchema.safeParse(row.country_scope);
  const programParsed = programSchema.safeParse(row.program);
  const statusParsed = documentStatusSchema.safeParse(row.publishing_status);
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    title: asString(row.title),
    summary: asString(row.summary),
    channel: parseChannel(row.channel),
    document_type: typeParsed.success ? typeParsed.data : "otro",
    country_scope: countryParsed.success ? countryParsed.data : "trinacional",
    program: programParsed.success ? programParsed.data : null,
    author: asString(row.author),
    cooperante: asString(row.cooperante),
    publication_date: normalizarFechaCalendario(asString(row.publication_date)),
    download_count: Number(row.download_count ?? 0),
    view_count: Number(row.view_count ?? 0),
    publishing_status: statusParsed.success ? statusParsed.data : undefined,
    created_at: asString(row.created_at),
    tags: extraerTags(row),
    cover_slug: null,
  };
}

export async function searchDocumentsPublic(
  filters: DocumentFilterParams,
): Promise<DocumentSearchResult> {
  const parsed = documentFilterParamsSchema.safeParse(filters);
  const params = parsed.success
    ? parsed.data
    : documentFilterParamsSchema.parse({});
  const channel =
    params.channel ??
    (params.canal ? channelDesdeCanal(params.canal) : null);
  const excludeChannel = esCanalDocumentos(params.canal) ? "noticia" : null;
  const page = params.page;
  const pageSize = params.page_size;
  const empty: DocumentSearchResult = {
    items: [],
    total: 0,
    page,
    page_size: pageSize,
  };

  try {
    const supabase = createPublicClient();
    const rpcArgs = {
      p_query: params.query || null,
      p_channel: channel,
      p_tag_slugs: params.tag_slugs.length > 0 ? params.tag_slugs : null,
      p_country: params.country_scope ?? null,
      p_program: params.program ?? null,
      p_sort: params.sort,
      p_limit: pageSize,
      p_offset: (page - 1) * pageSize,
    };
    let { data, error } = await supabase.rpc("search_library_documents", {
      ...rpcArgs,
      p_exclude_channel: excludeChannel,
    });
    if (error) {
      const retry = await supabase.rpc("search_library_documents", rpcArgs);
      data = retry.data;
      error = retry.error;
    }
    if (error || !data) return empty;
    const rows = data as Record<string, unknown>[];
    const total = Number(rows[0]?.total_count ?? 0);
    const mapped = await attachPortadas(
      supabase,
      await attachTagsToItems(supabase, rows.map(listItemFromRow)),
    );
    const items = excludeChannel
      ? mapped.filter((item) => item.channel !== excludeChannel)
      : mapped;
    return { items, total, page, page_size: pageSize };
  } catch {
    return empty;
  }
}

export type CatalogTagFilters = {
  query: string;
  canal?: DocumentFilterParams["canal"];
  country_scope?: DocumentFilterParams["country_scope"];
  program?: DocumentFilterParams["program"];
};

export async function getTagsCatalogoPublico(
  filters: CatalogTagFilters,
): Promise<TagRecord[]> {
  const bySlug = new Map<string, TagRecord>();
  const pageSize = 50;
  const maxPages = 8;

  try {
    for (let page = 1; page <= maxPages; page += 1) {
      const batch = await searchDocumentsPublic({
        query: filters.query,
        canal: filters.canal,
        country_scope: filters.country_scope,
        program: filters.program,
        tag_slugs: [],
        sort: "fecha_desc",
        page,
        page_size: pageSize,
      });
      for (const item of batch.items) {
        for (const tag of item.tags) {
          bySlug.set(tag.slug, tag);
        }
      }
      const totalPages = Math.max(1, Math.ceil(batch.total / pageSize));
      if (page >= totalPages || batch.items.length === 0) break;
    }
    return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  } catch {
    return [];
  }
}

export async function getNoticiasRelacionadas(params: {
  documentType: DocumentListItem["document_type"];
  excludeSlug: string;
  limit?: number;
}): Promise<DocumentListItem[]> {
  const limit = Math.min(Math.max(params.limit ?? 3, 1), 6);
  const exclude = params.excludeSlug.trim();
  if (!exclude) return [];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("library_documents")
      .select(
        "id, slug, title, summary, channel, document_type, country_scope, program, author, cooperante, publication_date, download_count, view_count, created_at, publishing_status",
      )
      .eq("channel", "noticia")
      .eq("document_type", params.documentType)
      .eq("publishing_status", "aprobado")
      .eq("access_level", "public")
      .neq("slug", exclude)
      .order("publication_date", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    const items = data.map((row) => listItemFromRow(row as Record<string, unknown>));
    return attachPortadas(supabase, await attachTagsToItems(supabase, items));
  } catch {
    return [];
  }
}

export async function getDocumentoPublico(
  canal: string,
  slug: string,
): Promise<DocumentRecord | null> {
  if (!slug.trim()) return null;
  const channel = channelDesdeCanal(canal);
  if (!channel && !esCanalDocumentos(canal)) return null;
  try {
    const supabase = createPublicClient();
    const porCanal = <T extends string>(select: T) => {
      const base = supabase
        .from("library_documents")
        .select(select)
        .eq("slug", slug.trim());
      return channel
        ? base.eq("channel", channel)
        : base.neq("channel", "noticia");
    };
    const first = await porCanal(DOCUMENT_SELECT_PUBLICO).maybeSingle();
    const row = first.error
      ? (await porCanal(DOCUMENT_SELECT).maybeSingle()).data
      : first.data;
    if (!row) return null;
    return normalizarDocumento(row as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getDocumentoVista(
  slug: string,
): Promise<DocumentRecord | null> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !slug.trim()) return null;
  try {
    const { data, error } = await auth.supabase
      .from("library_documents")
      .select(DOCUMENT_SELECT_PRIVADO)
      .eq("slug", slug.trim())
      .maybeSingle();
    if (error || !data) return null;
    const doc = normalizarDocumento(data as Record<string, unknown>);
    const esAdmin = isLibraryAdminRole(auth.user.role);
    const esDueno = doc.created_by === auth.user.id;
    const esPublico =
      doc.publishing_status === "aprobado" &&
      doc.access_level === "public" &&
      doc.channel !== "normativo_interno";
    if (!esAdmin && !esDueno && !esPublico) return null;
    const [withName] = await attachCreadores(auth.supabase, [doc]);
    return withName;
  } catch {
    return null;
  }
}

export async function getMisDocumentos(): Promise<DocumentRecord[]> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase) return [];
  try {
    const { data, error } = await auth.supabase
      .from("library_documents")
      .select(DOCUMENT_SELECT_PRIVADO)
      .eq("created_by", auth.user.id)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return attachCreadores(
      auth.supabase,
      data.map((row) => normalizarDocumento(row as Record<string, unknown>)),
    );
  } catch {
    return [];
  }
}

export async function getBandejaRevision(): Promise<DocumentRecord[]> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return [];
  try {
    const { data, error } = await auth.supabase
      .from("library_documents")
      .select(DOCUMENT_SELECT_PRIVADO)
      .eq("publishing_status", "en_revision")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return attachCreadores(
      auth.supabase,
      data.map((row) => normalizarDocumento(row as Record<string, unknown>)),
    );
  } catch {
    return [];
  }
}

export async function getDocumentoPorSlug(
  slug: string,
): Promise<DocumentRecord | null> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !slug.trim()) return null;
  try {
    const { data, error } = await auth.supabase
      .from("library_documents")
      .select(DOCUMENT_SELECT_PRIVADO)
      .eq("slug", slug.trim())
      .maybeSingle();
    if (error || !data) return null;
    const doc = normalizarDocumento(data as Record<string, unknown>);
    if (
      doc.created_by !== auth.user.id &&
      !isLibraryAdminRole(auth.user.role)
    ) {
      return null;
    }
    const [withName] = await attachCreadores(auth.supabase, [doc]);
    return withName;
  } catch {
    return null;
  }
}

export async function createDocumentAction(
  values: DocumentFormValues,
): Promise<ActionResultWithSlug> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error };

  const parsed = documentFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  try {
    const payload = payloadFromForm(parsed.data, auth.user.id);
    payload.actividad = await actividadConEvento(
      auth.supabase,
      [],
      auth.user.id,
      "creacion",
    );
    const { data, error } = await auth.supabase
      .from("library_documents")
      .insert(payload)
      .select("id, slug")
      .single();
    if (error || !data) return { success: false, error: "DB_ERROR" };

    const tagError = await replaceTags(
      auth.supabase,
      String(data.id),
      parsed.data.tag_ids,
    );
    if (tagError) return { success: false, error: tagError };

    return {
      success: true,
      error: null,
      id: String(data.id),
      slug: String(data.slug),
    };
  } catch {
    return { success: false, error: "DB_ERROR" };
  }
}

export async function updateDocumentAction(
  slug: string,
  values: DocumentFormValues,
  options?: { registrarActividad?: boolean },
): Promise<ActionResultWithSlug> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error };

  const parsed = documentFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const actual = await getDocumentoPorSlug(slug);
  if (!actual) return { success: false, error: "NOT_FOUND" };

  const esAdmin = isLibraryAdminRole(auth.user.role);
  if (!esAdmin && actual.publishing_status === "aprobado") {
    return { success: false, error: "FORBIDDEN" };
  }

  try {
    const payload = payloadFromForm(parsed.data);
    if (esAdmin && actual.publishing_status === "aprobado") {
      payload.publishing_status = "aprobado";
    }
    if (options?.registrarActividad !== false) {
      payload.actividad = await actividadConEvento(
        auth.supabase,
        semillaActividad(actual),
        auth.user.id,
        "modificacion",
      );
    }
    const { data, error } = await auth.supabase
      .from("library_documents")
      .update(payload)
      .eq("id", actual.id)
      .select("id, slug")
      .single();
    if (error || !data) return { success: false, error: "SAVE_FAILED" };

    const tagError = await replaceTags(
      auth.supabase,
      actual.id,
      parsed.data.tag_ids,
    );
    if (tagError) return { success: false, error: tagError };

    return {
      success: true,
      error: null,
      id: String(data.id),
      slug: String(data.slug),
    };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function updateAccessLevelAction(
  slug: string,
  accessLevel: string,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error };

  const parsed = updateAccessLevelSchema.safeParse({
    slug,
    access_level: accessLevel,
  });
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const actual = await getDocumentoPorSlug(parsed.data.slug);
  if (!actual) return { success: false, error: "NOT_FOUND" };
  if (
    !puedeEditarAccesoDocumento(actual, auth.user.id, auth.user.role)
  ) {
    return { success: false, error: "FORBIDDEN" };
  }

  const access =
    actual.channel === "normativo_interno" ? "interno" : parsed.data.access_level;

  try {
    const { error } = await auth.supabase
      .from("library_documents")
      .update({
        access_level: access,
        actividad: await actividadConEvento(
          auth.supabase,
          semillaActividad(actual),
          auth.user.id,
          "modificacion",
        ),
      })
      .eq("id", actual.id);
    if (error) return { success: false, error: "SAVE_FAILED" };
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function submitForReviewAction(slug: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error };
  const actual = await getDocumentoPorSlug(slug);
  if (!actual) return { success: false, error: "NOT_FOUND" };
  if (actual.publishing_status === "aprobado") {
    return { success: false, error: "FORBIDDEN" };
  }
  try {
    const { error } = await auth.supabase
      .from("library_documents")
      .update({ publishing_status: "en_revision", rejection_reason: null })
      .eq("id", actual.id);
    if (error) return { success: false, error: "SAVE_FAILED" };
    const histError = await anexarActividad(
      auth.supabase,
      actual.id,
      auth.user.id,
      semillaActividad(actual),
    );
    if (histError) return { success: false, error: histError };
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function approveDocumentAction(slug: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error };
  const actual = await getDocumentoPorSlug(slug);
  if (!actual) return { success: false, error: "NOT_FOUND" };
  try {
    const { error } = await auth.supabase
      .from("library_documents")
      .update({
        publishing_status: "aprobado",
        approved_by: auth.user.id,
        rejection_reason: null,
      })
      .eq("id", actual.id);
    if (error) return { success: false, error: "SAVE_FAILED" };
    const histError = await anexarActividad(
      auth.supabase,
      actual.id,
      auth.user.id,
      semillaActividad(actual),
    );
    if (histError) return { success: false, error: histError };
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function ocultarDocumentoAction(slug: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error };
  const actual = await getDocumentoPorSlug(slug);
  if (!actual || actual.publishing_status !== "aprobado") {
    return { success: false, error: actual ? "SAVE_FAILED" : "NOT_FOUND" };
  }
  try {
    const { error } = await auth.supabase
      .from("library_documents")
      .update({ publishing_status: "borrador" })
      .eq("id", actual.id)
      .eq("publishing_status", "aprobado");
    if (error) return { success: false, error: "SAVE_FAILED" };
    const histError = await anexarActividad(
      auth.supabase,
      actual.id,
      auth.user.id,
      semillaActividad(actual),
    );
    if (histError) return { success: false, error: histError };
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function rejectDocumentAction(
  slug: string,
  reason: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error };
  const parsed = rejectDocumentSchema.safeParse({ slug, reason });
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };
  const actual = await getDocumentoPorSlug(parsed.data.slug);
  if (!actual) return { success: false, error: "NOT_FOUND" };
  try {
    const { error } = await auth.supabase
      .from("library_documents")
      .update({
        publishing_status: "rechazado",
        rejection_reason: parsed.data.reason,
      })
      .eq("id", actual.id);
    if (error) return { success: false, error: "SAVE_FAILED" };
    const histError = await anexarActividad(
      auth.supabase,
      actual.id,
      auth.user.id,
      semillaActividad(actual),
    );
    if (histError) return { success: false, error: histError };
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function deleteDocumentAction(slug: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error };
  const actual = await getDocumentoPorSlug(slug);
  if (!actual) return { success: false, error: "NOT_FOUND" };
  const esAdmin = isLibraryAdminRole(auth.user.role);
  if (!esAdmin && actual.publishing_status === "aprobado") {
    return { success: false, error: "FORBIDDEN" };
  }
  try {
    if (actual.files.length > 0) {
      const admin = createAdminClient();
      await admin.storage
        .from(LIBRARY_BUCKET)
        .remove(actual.files.map((file) => file.file_path));
    }
    const { error } = await auth.supabase
      .from("library_documents")
      .delete()
      .eq("id", actual.id);
    if (error) return { success: false, error: "DELETE_FAILED" };
    return { success: true, error: null };
  } catch {
    return { success: false, error: "DELETE_FAILED" };
  }
}

export async function registrarArchivoAction(
  values: Parameters<typeof registrarArchivoSchema.parse>[0],
): Promise<ActionResult & { slug?: string }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error };
  const parsed = registrarArchivoSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  try {
    const { data, error } = await auth.supabase
      .from("library_document_files")
      .insert({
        document_id: parsed.data.document_id,
        kind: parsed.data.kind,
        file_path: parsed.data.file_path,
        original_name: parsed.data.original_name,
        mime_type: parsed.data.mime_type,
        file_size_bytes: parsed.data.file_size_bytes,
        sort_order: parsed.data.sort_order,
      })
      .select("slug")
      .single();
    if (error || !data) return { success: false, error: "SAVE_FAILED" };
    return { success: true, error: null, slug: String(data.slug) };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function eliminarArchivoAction(
  fileSlug: string,
  registrarActividad = true,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error };
  try {
    const { data, error } = await auth.supabase
      .from("library_document_files")
      .select("id, file_path, document_id")
      .eq("slug", fileSlug.trim())
      .maybeSingle();
    if (error || !data) return { success: false, error: "NOT_FOUND" };

    const admin = createAdminClient();
    await admin.storage.from(LIBRARY_BUCKET).remove([String(data.file_path)]);

    const { error: delError } = await auth.supabase
      .from("library_document_files")
      .delete()
      .eq("id", data.id);
    if (delError) return { success: false, error: "DELETE_FAILED" };
    if (registrarActividad) {
      const { data: doc } = await auth.supabase
        .from("library_documents")
        .select("id, actividad, created_at, created_by")
        .eq("id", data.document_id)
        .maybeSingle();
      if (doc) {
        const row = doc as Record<string, unknown>;
        let previa = parsearActividad(row.actividad);
        if (previa.length === 0 && asString(row.created_at)) {
          const creadorId = asNullableString(row.created_by);
          previa = [
            {
              accion: "creacion",
              user_id: creadorId,
              nombre: creadorId
                ? await nombreCompletoUsuario(auth.supabase, creadorId)
                : "Usuario",
              at: asString(row.created_at),
            },
          ];
        }
        const histError = await anexarActividad(
          auth.supabase,
          asString(row.id),
          auth.user.id,
          previa,
        );
        if (histError) return { success: false, error: histError };
      }
    }
    return { success: true, error: null };
  } catch {
    return { success: false, error: "DELETE_FAILED" };
  }
}

export async function getArchivoRepositorioPorSlug(slug: string): Promise<{
  slug: string;
  original_name: string;
  mime_type: string;
  file_size_bytes: number;
  kind: DocumentFileRecord["kind"];
} | null> {
  const limpio = slug.trim();
  if (!limpio) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("library_document_files")
      .select("slug, original_name, mime_type, file_size_bytes, kind")
      .eq("slug", limpio)
      .maybeSingle();
    if (error || !data) return null;
    const kindParsed = fileKindSchema.safeParse(data.kind);
    return {
      slug: asString(data.slug),
      original_name: asString(data.original_name),
      mime_type: asString(data.mime_type),
      file_size_bytes: Number(data.file_size_bytes ?? 0),
      kind: kindParsed.success ? kindParsed.data : "adjunto",
    };
  } catch {
    return null;
  }
}

export async function obtenerArchivoRepositorioPorSlug(slug: string): Promise<{
  body: Blob;
  mime: string;
  filename: string;
  inline: boolean;
} | null> {
  const limpio = slug.trim();
  if (!limpio) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("library_document_files")
      .select("file_path, original_name, mime_type")
      .eq("slug", limpio)
      .maybeSingle();
    if (error || !data) return null;

    const admin = createAdminClient();
    const downloaded = await admin.storage
      .from(LIBRARY_BUCKET)
      .download(String(data.file_path));
    if (downloaded.error || !downloaded.data) return null;

    const mime = asString(data.mime_type, "application/octet-stream");
    return {
      body: downloaded.data,
      mime,
      filename: asString(data.original_name, "archivo"),
      inline: esPdfMime(mime) || esImagenMime(mime),
    };
  } catch {
    return null;
  }
}

function cookieVisita(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return `siget_visita_${hash.toString(36)}`;
}

export async function registerViewAction(
  slug: string,
): Promise<{ success: boolean; view_count: number | null }> {
  const limpio = slug.trim();
  if (!limpio) return { success: false, view_count: null };
  try {
    const jar = await cookies();
    const key = cookieVisita(limpio);
    if (jar.get(key)) return { success: true, view_count: null };
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("register_library_view", {
      doc_slug: limpio,
    });
    if (error) return { success: false, view_count: null };
    jar.set(key, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    const count = typeof data === "number" ? data : Number(data ?? 0);
    return { success: true, view_count: Number.isFinite(count) ? count : null };
  } catch {
    return { success: false, view_count: null };
  }
}

export async function registerDownloadAction(fileSlug: string): Promise<ActionResult> {
  const limpio = fileSlug.trim();
  if (!limpio) return { success: false, error: "INVALID_INPUT" };
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("register_library_download", {
      file_slug: limpio,
    });
    if (error) return { success: false, error: "SAVE_FAILED" };
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}
