"use client";

import { useState } from "react";
import {
  ModalShell,
  ModalFooter,
  ModalCancelButton,
  ModalSubmit,
  ModalForm,
  modalActionMessage,
  toast,
} from "@/components/ui/general-modal";
import { useEditarActividad } from "../lib/hooks";
import {
  actividadFormSchema,
  normalizarFechaInput,
  type ActividadRecord,
} from "../lib/zod";
import { CamposUbicacionActividad } from "./CamposUbicacionActividad";

export function UbicacionForm({
  open,
  actividad,
  inicial,
  onClose,
}: {
  open: boolean;
  actividad: ActividadRecord | null;
  inicial?: {
    direccion: string;
    municipio: string;
    departamento: string;
  } | null;
  onClose: () => void;
}) {
  const editar = useEditarActividad();
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estabaAbierta, setEstabaAbierta] = useState(false);

  if (open && !estabaAbierta && actividad) {
    setEstabaAbierta(true);
    setDireccion(inicial?.direccion || actividad.direccion || "");
    setDepartamento(inicial?.departamento || actividad.departamento || "");
    setMunicipio(inicial?.municipio || actividad.municipio || "");
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
    if (!actividad) return;
    const parsed = actividadFormSchema.safeParse({
      nombre: actividad.nombre,
      descripcion: actividad.descripcion ?? "",
      fecha_realizacion: normalizarFechaInput(actividad.fecha_realizacion),
      direccion,
      departamento,
      municipio,
      activo: actividad.activo,
    });
    if (!parsed.success) {
      toast.warn("Completa departamento, municipio y dirección.");
      return;
    }
    const res = await editar.mutateAsync({
      id: actividad.id,
      values: parsed.data,
    });
    if (res.success) {
      toast.success("Ubicación guardada.");
      onClose();
    } else {
      toast.error(
        modalActionMessage(res.error ?? undefined, "No se pudo guardar la ubicación."),
      );
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title={
        actividad?.direccion || inicial?.direccion
          ? "Editar ubicación"
          : "Agregar ubicación"
      }
      maxWidth="max-w-lg"
    >
      <ModalForm onSubmit={handleSubmit}>
        <CamposUbicacionActividad
          idPrefix="ubi"
          direccion={direccion}
          departamento={departamento}
          municipio={municipio}
          onDireccionChange={setDireccion}
          onDepartamentoChange={setDepartamento}
          onMunicipioChange={setMunicipio}
        />
        <ModalFooter>
          <ModalCancelButton onClick={handleClose} disabled={editar.isPending} />
          <ModalSubmit disabled={editar.isPending} />
        </ModalFooter>
      </ModalForm>
    </ModalShell>
  );
}
