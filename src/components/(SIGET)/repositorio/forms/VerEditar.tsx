"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { modalAccentClass, modalActionMessage, toast } from "@/components/ui/general-modal";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import {
  useDocumento,
  useEditarDocumento,
  useEliminarArchivo,
  usePersistirNoticia,
  useTags,
} from "../lib/hooks";
import { subirArchivosDocumento } from "../lib/upload-client";
import type { DocumentFormValues } from "../lib/zod";
import type { NoticiaSeccionDraft } from "../lib/upload-client";
import { DocumentoForm } from "./DocumentoForm";
import { NoticiaWizard } from "./NoticiaWizard";
import { esImagenMime } from "../lib/storage";
import {
  rutaEditarDocumento,
  rutaRepositorioDocumentos,
  rutaRepositorioNoticias,
  segmentoListaRepositorio,
} from "../lib/helpers";

export function RepositorioEditar({
  slug,
  listaSegmento,
}: {
  slug: string;
  listaSegmento: "noticias" | "documentos";
}) {
  const router = useRouter();
  const { user } = useUserContext();
  const { data: tags = [] } = useTags();
  const { data: documento, isLoading } = useDocumento(slug);
  const editar = useEditarDocumento(slug);
  const quitarArchivo = useEliminarArchivo();
  const guardarNoticia = usePersistirNoticia();

  useEffect(() => {
    if (!documento) return;
    const esperado = segmentoListaRepositorio(documento.channel);
    if (esperado !== listaSegmento) {
      router.replace(rutaEditarDocumento(documento.slug, documento.channel));
    }
  }, [documento, listaSegmento, router]);

  const handleSubmit = async (values: DocumentFormValues, files: File[]) => {
    const res = await editar.mutateAsync(values);
    if (!res.success || !res.id) {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
      return;
    }
    if (files.length > 0 && user?.id) {
      const start = documento?.files.length ?? 0;
      const uploaded = await subirArchivosDocumento(user.id, res.id, files, start);
      if (!uploaded.success) {
        toast.warn("Los metadatos se guardaron, pero algunos archivos no se subieron.");
        return;
      }
    }
    toast.success(
      values.submit_for_review ? "Enviado a revisión." : "Cambios guardados.",
    );
    const canal = documento?.channel ?? values.channel;
    router.push(
      canal === "noticia" ? rutaRepositorioNoticias() : rutaRepositorioDocumentos(),
    );
  };

  const handleNoticia = async (
    values: DocumentFormValues,
    sections: NoticiaSeccionDraft[],
  ) => {
    if (!user?.id || !documento) {
      toast.error("Inicia sesión para guardar.");
      return;
    }
    const res = await guardarNoticia.mutateAsync({
      userId: user.id,
      values,
      sections,
      existingSlug: documento.slug,
      existingImageSlugs: documento.files
        .filter((file) => esImagenMime(file.mime_type) || file.kind === "imagen")
        .map((file) => file.slug),
    });
    if (!res.success) {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
      return;
    }
    toast.success(values.submit_for_review ? "Enviada a revisión." : "Cambios guardados.");
    router.push(rutaRepositorioNoticias());
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    );
  }

  if (!documento) {
    return (
      <p className="px-6 py-16 text-center text-sm text-muted-foreground">
        No se encontró el documento.
      </p>
    );
  }

  if (documento.channel === "noticia") {
    return (
      <NoticiaWizard
        tags={tags}
        documento={documento}
        userMeta={user?.user_metadata as Record<string, unknown> | undefined}
        userEmail={user?.email}
        pending={guardarNoticia.isPending}
        onCancel={() => router.push(rutaRepositorioNoticias())}
        onSave={handleNoticia}
      />
    );
  }

  return (
    <div className="relative w-full flex-1 bg-white dark:bg-zinc-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className={`mb-6 text-2xl ${modalAccentClass}`}>Editar documento</h1>
        <div className="rounded-2xl border border-border bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800">
          <DocumentoForm
            tags={tags}
            existingFiles={documento.files}
            initial={{
              title: documento.title,
              summary: documento.summary,
              content: documento.content,
              channel: documento.channel,
              document_type: documento.document_type,
              country_scope: documento.country_scope,
              program: documento.program,
              access_level: documento.access_level,
              author: documento.author,
              cooperante: documento.cooperante,
              publication_date: documento.publication_date,
              version: documento.version,
              tag_ids: documento.tags.map((tag) => tag.id),
            }}
            pending={editar.isPending || quitarArchivo.isPending}
            onSubmit={handleSubmit}
            onCancel={() => router.push(rutaRepositorioDocumentos())}
            onRemoveExisting={async (fileSlug) => {
              const res = await quitarArchivo.mutateAsync(fileSlug);
              if (!res.success) {
                toast.error(modalActionMessage(res.error ?? undefined, "No se pudo quitar."));
                return;
              }
              toast.success("Archivo quitado.");
            }}
          />
        </div>
      </div>
    </div>
  );
}
