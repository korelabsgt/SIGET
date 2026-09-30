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
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useCrearActividad, useActividades } from "../lib/hooks";
import { actividadFormSchema } from "../lib/zod";
import { isPrivilegedAsistenciaRole } from "../lib/helpers";
import { CamposUbicacionActividad } from "./CamposUbicacionActividad";
import { CampoAsignarActividad } from "./CampoAsignarActividad";

function nombreActividadNormalizado(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ").toLowerCase();
}

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
  const { data: actividades = [] } = useActividades();
  const { user, effectiveRole } = useUserContext();
  const puedeAsignar = isPrivilegedAsistenciaRole(effectiveRole);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaRealizacion, setFechaRealizacion] = useState(fechaCalendarioGt);
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [asignarOtro, setAsignarOtro] = useState(false);
  const [encargadoId, setEncargadoId] = useState("");

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setFechaRealizacion(fechaCalendarioGt());
    setDireccion("");
    setDepartamento("");
    setMunicipio("");
    setAsignarOtro(false);
    setEncargadoId("");
  };

  const handleClose = () => {
    if (crear.isPending) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombreNorm = nombreActividadNormalizado(nombre);
    if (
      nombreNorm &&
      actividades.some(
        (act) => nombreActividadNormalizado(act.nombre) === nombreNorm,
      )
    ) {
      toast.error("Ya existe una actividad con ese nombre.");
      return;
    }
    if (asignarOtro && !encargadoId) {
      toast.warn("Elige a quién asignar la actividad.");
      return;
    }
    const parsed = actividadFormSchema.safeParse({
      nombre,
      descripcion,
      fecha_realizacion: fechaRealizacion,
      direccion,
      departamento,
      municipio,
      activo: true,
      encargado_id: asignarOtro ? encargadoId : null,
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
        <CampoAsignarActividad
          open={open}
          enabled={puedeAsignar}
          asignar={asignarOtro}
          onAsignarChange={setAsignarOtro}
          encargadoId={encargadoId}
          onEncargadoChange={setEncargadoId}
          excludeId={user?.id}
        />
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
