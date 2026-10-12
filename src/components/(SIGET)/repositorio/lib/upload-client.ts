"use client";

import { createClient } from "@/utils/supabase/client";
import {
  createDocumentAction,
  eliminarArchivoAction,
  registrarArchivoAction,
  updateDocumentAction,
} from "./actions";
import {
  parsearNoticiaContent,
  serializarNoticiaContent,
} from "./helpers";
import { kindDesdeMime, LIBRARY_BUCKET, LIBRARY_MAX_BYTES, rutaStorageArchivo } from "./storage";
import { normalizarVideoNoticia } from "./noticia-video";
import { esNoticiaAspectId } from "./noticia-imagen";
import type { DocumentFormValues, NoticiaSeccion } from "./zod";
import { NOTICIA_GALERIA_MAX } from "./zod";

export type NoticiaGaleriaDraftItem = {
  slug: string | null;
  file: File | null;
};

export type NoticiaSeccionDraft = NoticiaSeccion & {
  gallery: NoticiaGaleriaDraftItem[];
};

export async function subirArchivoDocumento(
  userId: string,
  documentId: string,
  file: File,
  order = 0,
): Promise<{ success: boolean; error: string | null; slug?: string }> {
  if (file.size > LIBRARY_MAX_BYTES) return { success: false, error: "STORAGE_ERROR" };
  const supabase = createClient();
  const fileId = crypto.randomUUID();
  const path = rutaStorageArchivo(userId, documentId, fileId, file.name);
  const uploaded = await supabase.storage.from(LIBRARY_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (uploaded.error) return { success: false, error: "STORAGE_ERROR" };
  const registered = await registrarArchivoAction({
    document_id: documentId,
    kind: kindDesdeMime(file.type),
    file_path: path,
    original_name: file.name,
    mime_type: file.type || "application/octet-stream",
    file_size_bytes: file.size,
    sort_order: order,
  });
  if (!registered.success) return { success: false, error: registered.error };
  return { success: true, error: null, slug: registered.slug };
}

export async function subirArchivosDocumento(
  userId: string,
  documentId: string,
  files: File[],
  startOrder = 0,
): Promise<{ success: boolean; error: string | null }> {
  if (files.length === 0) return { success: true, error: null };
  let order = startOrder;
  for (const file of files) {
    const uploaded = await subirArchivoDocumento(userId, documentId, file, order);
    if (!uploaded.success) return { success: false, error: uploaded.error };
    order += 1;
  }
  return { success: true, error: null };
}

function galeriaSlugsDesdeDraft(section: NoticiaSeccionDraft): string[] {
  return section.gallery
    .map((item) => item.slug)
    .filter((slug): slug is string => Boolean(slug))
    .slice(0, NOTICIA_GALERIA_MAX);
}

export async function persistirNoticia(params: {
  userId: string;
  values: DocumentFormValues;
  sections: NoticiaSeccionDraft[];
  existingSlug?: string;
  existingImageSlugs?: string[];
}): Promise<{ success: boolean; error: string | null; slug?: string; id?: string }> {
  const contentInicial = serializarNoticiaContent({
    kind: "noticia_secciones",
    sections: params.sections.map((section) => ({
      id: section.id,
      heading: section.heading,
      body: section.body,
      image_slug: galeriaSlugsDesdeDraft(section)[0] ?? null,
      gallery_slugs: galeriaSlugsDesdeDraft(section),
      foto_aspect: esNoticiaAspectId(section.foto_aspect) ? section.foto_aspect : null,
      video_url: normalizarVideoNoticia(section.video_url),
    })),
  });
  const values: DocumentFormValues = {
    ...params.values,
    channel: "noticia",
    document_type: params.values.document_type || "articulo",
    access_level: "public",
    content: contentInicial,
  };

  let slug = params.existingSlug;
  let id: string | undefined;

  if (slug) {
    const updated = await updateDocumentAction(slug, values);
    if (!updated.success || !updated.id || !updated.slug) {
      return { success: false, error: updated.error };
    }
    id = updated.id;
    slug = updated.slug;
  } else {
    const created = await createDocumentAction(values);
    if (!created.success || !created.id || !created.slug) {
      return { success: false, error: created.error };
    }
    id = created.id;
    slug = created.slug;
  }

  const nextSections: NoticiaSeccion[] = [];
  let order = 0;
  const usedSlugs: string[] = [];
  for (const section of params.sections) {
    const gallerySlugs: string[] = [];
    for (const item of section.gallery.slice(0, NOTICIA_GALERIA_MAX)) {
      if (!item.slug && !item.file) continue;
      let itemSlug = item.slug;
      if (item.file) {
        const uploaded = await subirArchivoDocumento(params.userId, id, item.file, order);
        if (!uploaded.success || !uploaded.slug) {
          return { success: false, error: uploaded.error ?? "STORAGE_ERROR", slug, id };
        }
        itemSlug = uploaded.slug;
        order += 1;
      }
      if (itemSlug) {
        gallerySlugs.push(itemSlug);
        usedSlugs.push(itemSlug);
      }
    }

    nextSections.push({
      id: section.id,
      heading: section.heading.trim(),
      body: section.body.trim(),
      image_slug: gallerySlugs[0] ?? null,
      gallery_slugs: gallerySlugs,
      foto_aspect: esNoticiaAspectId(section.foto_aspect) ? section.foto_aspect : null,
      video_url: normalizarVideoNoticia(section.video_url),
    });
  }

  const contentFinal = serializarNoticiaContent({
    kind: "noticia_secciones",
    sections: nextSections.length > 0 ? nextSections : parsearNoticiaContent("").sections,
  });
  const refreshed = await updateDocumentAction(slug, { ...values, content: contentFinal });
  if (!refreshed.success) {
    return { success: false, error: refreshed.error, slug, id };
  }

  const keep = new Set(usedSlugs);
  for (const oldSlug of params.existingImageSlugs ?? []) {
    if (!keep.has(oldSlug)) {
      await eliminarArchivoAction(oldSlug);
    }
  }

  return { success: true, error: null, slug: refreshed.slug ?? slug, id: refreshed.id ?? id };
}
