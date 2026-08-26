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
import { fechaCalendarioGt } from "@/lib/fechas-gt";
import { useCrearActividad } from "../lib/hooks";
import { actividadFormSchema } from "../lib/zod";
import { CamposUbicacionActividad } from "./CamposUbicacionActividad";

export function CrearActividad({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (slug: string) => void;
}) {
  const crear = useCrearActividad();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaRealizacion, setFechaRealizacion] = useState(fechaCalendarioGt);
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setFechaRealizacion(fechaCalendarioGt());
    setDireccion("");
    setDepartamento("");
    setMunicipio("");
  };

  const handleClose = () => {
    if (crear.isPending) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = actividadFormSchema.safeParse({
      nombre,
      descripcion,
      fecha_realizacion: fechaRealizacion,
      direccion,
      departamento,
      municipio,
      activo: true,
    });
    if (!parsed.success) {
      toast.warn("Revisa los datos del formulario.");
      return;
    }
    const res = await crear.mutateAsync(parsed.data);
    if (res.success && res.slug) {
      toast.success("Actividad creada correctamente.");
      resetForm();
      onCreated?.(res.slug);
      onClose();
    } else if (res.success && res.id) {
      toast.success("Actividad creada correctamente.");
      resetForm();
      onCreated?.(res.id);
      onClose();
    } else {
      toast.error(
        modalActionMessage(res.error ?? undefined, "No se pudo crear la actividad."),
      );
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Nueva actividad"
      maxWidth="max-w-lg"
    >
      <ModalForm onSubmit={handleSubmit}>
        <ModalField>
          <ModalLabel htmlFor="act-nombre">Nombre de la actividad</ModalLabel>
          <ModalInput
            id="act-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="act-fecha">Fecha de la actividad</ModalLabel>
          <ModalFechaInput
            id="act-fecha"
            value={fechaRealizacion}
            onChange={setFechaRealizacion}
            required
          />
        </ModalField>
        <CamposUbicacionActividad
          idPrefix="act"
          direccion={direccion}
          departamento={departamento}
          municipio={municipio}
          onDireccionChange={setDireccion}
          onDepartamentoChange={setDepartamento}
          onMunicipioChange={setMunicipio}
        />
        <ModalField>
          <ModalLabel htmlFor="act-desc">Descripción (opcional)</ModalLabel>
          <ModalTextarea
            id="act-desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </ModalField>
        <ModalFooter>
          <ModalCancelButton onClick={handleClose} disabled={crear.isPending} />
          <ModalSubmit disabled={crear.isPending} />
        </ModalFooter>
      </ModalForm>
    </ModalShell>
  );
}
