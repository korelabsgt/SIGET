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
import { useEditarArchivoNodo } from "../lib/hooks";
import { editarArchivoNodoSchema } from "../lib/zod";
import type { ArchivoNodo } from "../lib/archivos";

export function EditarArchivo({
  open,
  onClose,
  actividadId,
  nodo,
}: {
  open: boolean;
  onClose: () => void;
  actividadId: string;
  nodo: ArchivoNodo | null;
}) {
  const editar = useEditarArchivoNodo(actividadId);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estabaAbierta, setEstabaAbierta] = useState(false);

  if (open && !estabaAbierta && nodo) {
    setEstabaAbierta(true);
    setNombre(nodo.nombre);
    setDescripcion(nodo.descripcion ?? "");
  }
  if (!open && estabaAbierta) {
    setEstabaAbierta(false);
  }

  const handleClose = () => {
    if (editar.isPending) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodo) return;
    const parsed = editarArchivoNodoSchema.safeParse({
      id: nodo.id,
      nombre,
      descripcion,
    });
    if (!parsed.success) {
      toast.warn("Revisa el nombre.");
      return;
    }
    const res = await editar.mutateAsync(parsed.data);
    if (res.success) {
      toast.success("Cambios guardados.");
      onClose();
    } else {
      toast.error(
        modalActionMessage(res.error ?? undefined, "No se pudo guardar."),
      );
    }
  };

  const titulo =
    nodo?.tipo === "carpeta"
      ? "Editar carpeta"
      : nodo?.tipo === "enlace"
        ? "Editar enlace"
        : "Editar archivo";

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title={titulo}
      maxWidth="max-w-md"
    >
      <ModalForm onSubmit={handleSubmit}>
        <ModalField>
          <ModalLabel htmlFor="arch-edit-nombre">Nombre</ModalLabel>
          <ModalInput
            id="arch-edit-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="arch-edit-desc">Descripción (opcional)</ModalLabel>
          <ModalTextarea
            id="arch-edit-desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </ModalField>
        <ModalFooter>
          <ModalCancelButton onClick={handleClose} disabled={editar.isPending} />
          <ModalSubmit disabled={editar.isPending} />
        </ModalFooter>
      </ModalForm>
    </ModalShell>
  );
}
