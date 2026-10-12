"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveDocumentAction,
  createDocumentAction,
  deleteDocumentAction,
  eliminarArchivoAction,
  getBandejaRevision,
  getDocumentoPorSlug,
  getMisDocumentos,
  getTags,
  createTagAction,
  registrarArchivoAction,
  rejectDocumentAction,
  searchDocumentsPublic,
  submitForReviewAction,
  updateDocumentAction,
} from "./actions";
import { persistirNoticia } from "./upload-client";
import type {
  DocumentFilterParams,
  DocumentFormValues,
  RegistrarArchivoValues,
} from "./zod";

const TAGS_KEY = ["library-tags"];
const MIS_DOCS_KEY = ["library-mis-documentos"];
const BANDEJA_KEY = ["library-bandeja"];
const PUBLIC_KEY = ["library-public"];

export function useTags() {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: getTags,
  });
}

export function useCrearTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createTagAction({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_KEY });
    },
  });
}

export function useMisDocumentos() {
  return useQuery({
    queryKey: MIS_DOCS_KEY,
    queryFn: getMisDocumentos,
  });
}

export function useBandejaRevision(enabled: boolean) {
  return useQuery({
    queryKey: BANDEJA_KEY,
    queryFn: getBandejaRevision,
    enabled,
  });
}

export function useDocumento(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["library-documento", slug],
    queryFn: () => getDocumentoPorSlug(slug),
    enabled: enabled && slug.length > 0,
  });
}

export function useDocumentosPublicos(filters: DocumentFilterParams) {
  return useQuery({
    queryKey: [...PUBLIC_KEY, filters],
    queryFn: () => searchDocumentsPublic(filters),
  });
}

function useInvalidateLibrary() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: MIS_DOCS_KEY });
    queryClient.invalidateQueries({ queryKey: BANDEJA_KEY });
    queryClient.invalidateQueries({ queryKey: PUBLIC_KEY });
    queryClient.invalidateQueries({ queryKey: ["library-documento"] });
  };
}

export function useCrearDocumento() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (values: DocumentFormValues) => createDocumentAction(values),
    onSuccess: invalidate,
  });
}

export function useEditarDocumento(slug: string) {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (values: DocumentFormValues) =>
      updateDocumentAction(slug, values),
    onSuccess: invalidate,
  });
}

export function usePersistirNoticia() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: persistirNoticia,
    onSuccess: invalidate,
  });
}

export function useEnviarRevision() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (slug: string) => submitForReviewAction(slug),
    onSuccess: invalidate,
  });
}

export function useAprobarDocumento() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (slug: string) => approveDocumentAction(slug),
    onSuccess: invalidate,
  });
}

export function useRechazarDocumento() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: ({ slug, reason }: { slug: string; reason: string }) =>
      rejectDocumentAction(slug, reason),
    onSuccess: invalidate,
  });
}

export function useEliminarDocumento() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (slug: string) => deleteDocumentAction(slug),
    onSuccess: invalidate,
  });
}

export function useRegistrarArchivo() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (values: RegistrarArchivoValues) =>
      registrarArchivoAction(values),
    onSuccess: invalidate,
  });
}

export function useEliminarArchivo() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (fileSlug: string) => eliminarArchivoAction(fileSlug),
    onSuccess: invalidate,
  });
}
