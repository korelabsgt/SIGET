"use client";

import { useState } from "react";
import {
  ModalShell,
  ModalInput,
  ModalLabel,
  ModalTextarea,
  ModalSubmit,
  ModalFooter,
  ModalCancelButton,
  ModalForm,
  ModalField,
  modalActionMessage,
  toast,
} from "@/components/ui/general-modal";
import { useCrearCarpetaArchivo } from "../lib/hooks";
import { carpetaArchivoSchema, type CarpetaArchivoValues } from "../lib/zod";

export function CrearCarpeta({
  open,
  onClose,
  actividadId,
  visibilidad,
  parentId,
}: {
  open: boolean;
  onClose: () => void;
  actividadId: string;
  visibilidad: CarpetaArchivoValues["visibilidad"];
  parentId: string | null;
}) {
  const crear = useCrearCarpetaArchivo(actividadId);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
  };

  const handleClose = () => {
    if (crear.isPending) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = carpetaArchivoSchema.safeParse({
      actividadId,
      visibilidad,
      parentId,
      nombre,
      descripcion,
    });
    if (!parsed.success) {
      toast.warn("Revisa el nombre de la carpeta.");
      return;
    }
    const res = await crear.mutateAsync(parsed.data);
    if (res.success) {
      toast.success("Carpeta creada.");
      resetForm();
      onClose();
    } else {
      toast.error(
        modalActionMessage(res.error ?? undefined, "No se pudo crear la carpeta."),
      );
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Nueva carpeta"
      maxWidth="max-w-md"
    >
      <ModalForm onSubmit={handleSubmit}>
        <ModalField>
          <ModalLabel htmlFor="arch-carpeta-nombre">Nombre</ModalLabel>
          <ModalInput
            id="arch-carpeta-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="arch-carpeta-desc">Descripción (opcional)</ModalLabel>
          <ModalTextarea
            id="arch-carpeta-desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </ModalField>
        <ModalFooter>
          <ModalCancelButton onClick={handleClose} disabled={crear.isPending} />
          <ModalSubmit label="Crear" disabled={crear.isPending} />
        </ModalFooter>
      </ModalForm>
    </ModalShell>
  );
}
