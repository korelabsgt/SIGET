"use server";

import { createClient } from "@/utils/supabase/server";
import { createPublicClient } from "@/utils/supabase/public";
import { createAdminClient } from "@/utils/supabase/admin";
import { normalizarFechaCalendario } from "@/lib/fechas-gt";
import {
  documentFormSchema,
  documentFilterParamsSchema,
  rejectDocumentSchema,
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
  type DocumentChannel,
} from "./zod";
import { channelDesdeCanal, isLibraryAdminRole, slugifyEtiqueta } from "./helpers";
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
    created_by: asNullableString(row.created_by),
    created_by_nombre: extraerNombreCreador(row),
    approved_by: asNullableString(row.approved_by),
    rejection_reason: asNullableString(row.rejection_reason),
    created_at: asString(row.created_at),
    updated_at: asNullableString(row.updated_at),
    tags: extraerTags(row),
    files: extraerArchivos(row),
  };
}

const DOCUMENT_SELECT = `
  id, slug, title, summary, content, channel, document_type, country_scope,
  program, access_level, publishing_status, author, cooperante, publication_date,
  version, download_count, created_by, approved_by, rejection_reason,
  created_at, updated_at,
  document_tags ( tags ( id, name, slug ) ),
  library_document_files ( * )
`;

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
    const { data, error } = await supabase.rpc("search_library_documents", {
      p_query: params.query || null,
      p_channel: channel,
      p_tag_slugs: params.tag_slugs.length > 0 ? params.tag_slugs : null,
      p_country: params.country_scope ?? null,
      p_program: params.program ?? null,
      p_sort: params.sort,
      p_limit: pageSize,
      p_offset: (page - 1) * pageSize,
    });
    if (error || !data) return empty;
    const rows = data as Record<string, unknown>[];
    const total = Number(rows[0]?.total_count ?? 0);
    const items = await attachPortadas(
      supabase,
      await attachTagsToItems(supabase, rows.map(listItemFromRow)),
    );
    return { items, total, page, page_size: pageSize };
  } catch {
    return empty;
  }
}

export async function getDocumentoPublico(
  canal: string,
  slug: string,
): Promise<DocumentRecord | null> {
  const channel = channelDesdeCanal(canal);
  if (!channel || !slug.trim()) return null;
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("library_documents")
      .select(DOCUMENT_SELECT)
      .eq("slug", slug.trim())
      .eq("channel", channel)
      .maybeSingle();
    if (error || !data) return null;
    return normalizarDocumento(data as Record<string, unknown>);
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
      .select(DOCUMENT_SELECT)
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
      .select(DOCUMENT_SELECT)
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
      .select(DOCUMENT_SELECT)
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
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function approveDocumentAction(slug: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error };
  try {
    const { error } = await auth.supabase
      .from("library_documents")
      .update({
        publishing_status: "aprobado",
        approved_by: auth.user.id,
        rejection_reason: null,
      })
      .eq("slug", slug.trim());
    if (error) return { success: false, error: "SAVE_FAILED" };
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
  try {
    const { error } = await auth.supabase
      .from("library_documents")
      .update({
        publishing_status: "rechazado",
        rejection_reason: parsed.data.reason,
      })
      .eq("slug", parsed.data.slug);
    if (error) return { success: false, error: "SAVE_FAILED" };
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

export async function eliminarArchivoAction(fileSlug: string): Promise<ActionResult> {
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
