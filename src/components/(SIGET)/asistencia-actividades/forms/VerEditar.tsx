"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  ModalShell,
  ModalInput,
  ModalLabel,
  ModalTextarea,
  ModalSubmit,
  ModalFooter,
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
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (actividad) {
      setNombre(actividad.nombre);
      setDescripcion(actividad.descripcion ?? "");
      setFechaRealizacion(normalizarFechaInput(actividad.fecha_realizacion));
      setDireccion(actividad.direccion ?? "");
      setDepartamento(actividad.departamento ?? "");
      setMunicipio(actividad.municipio ?? "");
      setActivo(actividad.activo);
    }
  }, [actividad]);

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
      activo,
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
      subtitle="Registro de asistencia"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <ModalLabel htmlFor="edit-nombre">Nombre de la actividad</ModalLabel>
          <ModalInput
            id="edit-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <ModalLabel htmlFor="edit-fecha">Fecha de la actividad</ModalLabel>
          <ModalInput
            id="edit-fecha"
            type="date"
            value={fechaRealizacion}
            onChange={(e) => setFechaRealizacion(e.target.value)}
            required
          />
        </div>
        <CamposUbicacionActividad
          idPrefix="edit"
          direccion={direccion}
          departamento={departamento}
          municipio={municipio}
          onDireccionChange={setDireccion}
          onDepartamentoChange={setDepartamento}
          onMunicipioChange={setMunicipio}
        />
        <div className="space-y-2">
          <ModalLabel htmlFor="edit-desc">Descripción (opcional)</ModalLabel>
          <ModalTextarea
            id="edit-desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground/70">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="size-4 rounded border-celeste-trifinio accent-celeste-trifinio"
          />
          Actividad activa (acepta registros)
        </label>
        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={editar.isPending}
            className="flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            Cancelar
          </button>
          <ModalSubmit disabled={editar.isPending}>
            {editar.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </ModalSubmit>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
