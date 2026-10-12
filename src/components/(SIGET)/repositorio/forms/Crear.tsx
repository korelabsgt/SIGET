"use client";

import { useRouter } from "next/navigation";
import { modalActionMessage, toast } from "@/components/ui/general-modal";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { modalAccentClass } from "@/components/ui/general-modal";
import { fechaCalendarioGt } from "@/lib/fechas-gt";
import { nombreDesdeMetadata, rutaEditarDocumento, rutaRepositorioDocumentos } from "../lib/helpers";
import { useCrearDocumento, useTags } from "../lib/hooks";
import { subirArchivosDocumento } from "../lib/upload-client";
import type { DocumentFormValues } from "../lib/zod";
import { DocumentoForm } from "./DocumentoForm";

export function RepositorioCrear() {
  const router = useRouter();
  const { user } = useUserContext();
  const { data: tags = [] } = useTags();
  const crear = useCrearDocumento();

  const handleSubmit = async (values: DocumentFormValues, files: File[]) => {
    const res = await crear.mutateAsync(values);
    if (!res.success || !res.id || !res.slug) {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
      return;
    }
    if (files.length > 0 && user?.id) {
      const uploaded = await subirArchivosDocumento(user.id, res.id, files);
      if (!uploaded.success) {
        toast.warn("El documento se guardó, pero algunos archivos no se subieron.");
        router.push(rutaEditarDocumento(res.slug, values.channel));
        return;
      }
    }
    toast.success(
      values.submit_for_review ? "Enviado a revisión." : "Borrador guardado.",
    );
    router.push(rutaRepositorioDocumentos());
  };

  return (
    <div className="relative w-full flex-1 bg-white dark:bg-zinc-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className={`mb-6 text-2xl ${modalAccentClass}`}>Nuevo documento</h1>
        <div className="rounded-2xl border border-border bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800">
          <DocumentoForm
            tags={tags}
            initial={{
              publication_date: fechaCalendarioGt(),
              channel: "cientifico",
              author: nombreDesdeMetadata(
                user?.user_metadata as Record<string, unknown> | undefined,
                user?.email?.split("@")[0] ?? "",
              ),
            }}
            pending={crear.isPending}
            onSubmit={handleSubmit}
            onCancel={() => router.push(rutaRepositorioDocumentos())}
          />
        </div>
      </div>
    </div>
  );
}
