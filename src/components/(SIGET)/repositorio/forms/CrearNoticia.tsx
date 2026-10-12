"use client";

import { useRouter } from "next/navigation";
import { modalActionMessage, toast } from "@/components/ui/general-modal";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { usePersistirNoticia, useTags } from "../lib/hooks";
import type { DocumentFormValues } from "../lib/zod";
import type { NoticiaSeccionDraft } from "../lib/upload-client";
import { rutaRepositorioNoticias } from "../lib/helpers";
import { NoticiaWizard } from "./NoticiaWizard";

export function CrearNoticia() {
  const router = useRouter();
  const { user } = useUserContext();
  const { data: tags = [] } = useTags();
  const guardar = usePersistirNoticia();

  const handleSave = async (
    values: DocumentFormValues,
    sections: NoticiaSeccionDraft[],
  ) => {
    if (!user?.id) {
      toast.error("Inicia sesión para guardar.");
      return;
    }
    const res = await guardar.mutateAsync({
      userId: user.id,
      values,
      sections,
    });
    if (!res.success) {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
      return;
    }
    toast.success(values.submit_for_review ? "Enviada a revisión." : "Borrador guardado.");
    router.push(rutaRepositorioNoticias());
  };

  return (
    <NoticiaWizard
      tags={tags}
      userMeta={user?.user_metadata as Record<string, unknown> | undefined}
      userEmail={user?.email}
      pending={guardar.isPending}
      onCancel={() => router.push(rutaRepositorioNoticias())}
      onSave={handleSave}
    />
  );
}
