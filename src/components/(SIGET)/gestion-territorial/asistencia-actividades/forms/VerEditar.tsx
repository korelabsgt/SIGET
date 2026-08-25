"use client";

import { useState } from "react";
import { toast } from "react-toastify";
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
  ModalFechaInput,
  modalActionMessage,
} from "@/components/ui/general-modal";
import { useEditarActividad } from "../lib/hooks";
import { actividadFormSchema, normalizarFechaInput, type ActividadRecord } from "../lib/zod";
import { CamposUbicacionActividad } from "./CamposUbicacionActividad";

export function VerEditarActividad({
  open,
  actividad,
  onClose,
}: {
  open: boolean;
  actividad: ActividadRecord | null;
  onClose: () => void;
}) {
  const editar = useEditarActividad();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaRealizacion, setFechaRealizacion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [actividadSincronizada, setActividadSincronizada] = useState<
    ActividadRecord | null
  >(null);

  if (actividad && actividad !== actividadSincronizada) {
    setActividadSincronizada(actividad);
    setNombre(actividad.nombre);
    setDescripcion(actividad.descripcion ?? "");
    setFechaRealizacion(normalizarFechaInput(actividad.fecha_realizacion));
    setDireccion(actividad.direccion ?? "");
    setDepartamento(actividad.departamento ?? "");
    setMunicipio(actividad.municipio ?? "");
  }

  const handleClose = () => {
    if (editar.isPending) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividad) return;
    const parsed = actividadFormSchema.safeParse({
      nombre,
      descripcion,
      fecha_realizacion: fechaRealizacion,
      direccion,
      departamento,
      municipio,
      activo: actividad.activo,
    });
    if (!parsed.success) {
      toast.warn("Revisa los datos del formulario.");
      return;
    }
    const res = await editar.mutateAsync({ id: actividad.id, values: parsed.data });
    if (res.success) {
      toast.success("Actividad actualizada.");
      onClose();
    } else {
      toast.error(
        modalActionMessage(res.error ?? undefined, "No se pudo actualizar."),
      );
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Editar actividad"
      maxWidth="max-w-lg"
    >
      <ModalForm onSubmit={handleSubmit}>
        <ModalField>
          <ModalLabel htmlFor="edit-nombre">Nombre de la actividad</ModalLabel>
          <ModalInput
            id="edit-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="edit-fecha">Fecha de la actividad</ModalLabel>
          <ModalFechaInput
            id="edit-fecha"
            value={fechaRealizacion}
            onChange={setFechaRealizacion}
            required
          />
        </ModalField>
        <CamposUbicacionActividad
          idPrefix="edit"
          direccion={direccion}
          departamento={departamento}
          municipio={municipio}
          onDireccionChange={setDireccion}
          onDepartamentoChange={setDepartamento}
          onMunicipioChange={setMunicipio}
        />
        <ModalField>
          <ModalLabel htmlFor="edit-desc">Descripción (opcional)</ModalLabel>
          <ModalTextarea
            id="edit-desc"
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
