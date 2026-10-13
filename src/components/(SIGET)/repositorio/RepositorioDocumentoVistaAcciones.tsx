"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Globe,
  Lock,
  LockOpen,
  Pencil,
  SquarePen,
} from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { modalActionMessage, toast } from "@/components/ui/general-modal";
import { ACCESS_LABELS } from "./lib/helpers";
import { useActualizarAcceso } from "./lib/hooks";
import { confirmCambiarAcceso } from "./lib/swal";
import type { AccessLevel } from "./lib/zod";

export function RepositorioDocumentoVistaAcciones({
  slug,
  volverHref,
  editarHref,
  publicoHref,
  accessLevel,
  canToggleAccess,
}: {
  slug: string;
  volverHref: string;
  editarHref: string | null;
  publicoHref: string | null;
  accessLevel: AccessLevel;
  canToggleAccess: boolean;
}) {
  const router = useRouter();
  const actualizarAcceso = useActualizarAcceso(slug);
  const esPublico = accessLevel === "public";

  const cambiarAcceso = async () => {
    const siguiente: AccessLevel = esPublico ? "interno" : "public";
    const ok = await confirmCambiarAcceso(siguiente === "public");
    if (!ok) return;
    const res = await actualizarAcceso.mutateAsync(siguiente);
    if (!res.success) {
      toast.error(
        modalActionMessage(res.error ?? undefined, "No se pudo cambiar el acceso."),
      );
      return;
    }
    toast.success(
      siguiente === "public"
        ? "El documento quedó público."
        : "El documento quedó privado.",
    );
    router.refresh();
  };

  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="justify-self-start">
        <SigetActionButton
          label="Volver"
          accentColor={sigetAccent.cancelar}
          morphFrom={ArrowLeft}
          morphTo={ArrowLeft}
          morphOnHover={false}
          iconSide="left"
          onClick={() => router.push(volverHref)}
          className="w-auto shrink-0"
        />
      </div>
      <div className="justify-self-center">
        {canToggleAccess ? (
          <SigetActionButton
            label={ACCESS_LABELS[accessLevel]}
            accentColor={esPublico ? sigetAccent.activa : sigetAccent.inactiva}
            morphFrom={esPublico ? Globe : Lock}
            morphTo={esPublico ? LockOpen : Lock}
            role="switch"
            ariaChecked={esPublico}
            ariaBusy={actualizarAcceso.isPending}
            disabled={actualizarAcceso.isPending}
            ariaLabel={
              esPublico ? "Pasar a privado" : "Pasar a público"
            }
            onClick={() => {
              void cambiarAcceso();
            }}
            className="w-auto shrink-0"
          />
        ) : publicoHref ? (
          <SigetActionButton
            label="Público"
            accentColor={sigetAccent.abrir}
            morphFrom={Eye}
            morphTo={Eye}
            morphOnHover={false}
            ariaLabel="Ver en el catálogo público"
            onClick={() => router.push(publicoHref)}
            className="w-auto shrink-0"
          />
        ) : (
          <SigetActionButton
            label={ACCESS_LABELS[accessLevel]}
            accentColor={esPublico ? sigetAccent.activa : sigetAccent.inactiva}
            morphFrom={esPublico ? Globe : Lock}
            morphTo={esPublico ? Globe : Lock}
            morphOnHover={false}
            disabled
            className="w-auto shrink-0"
          />
        )}
      </div>
      <div className="justify-self-end">
        {editarHref ? (
          <SigetActionButton
            label="Editar"
            accentColor={sigetAccent.editar}
            morphFrom={Pencil}
            morphTo={SquarePen}
            onClick={() => router.push(editarHref)}
            className="w-auto shrink-0"
          />
        ) : null}
      </div>
    </div>
  );
}
