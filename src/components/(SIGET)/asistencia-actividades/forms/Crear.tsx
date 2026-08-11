"use client";

import { useState } from "react";
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
  onCreated?: (id: string) => void;
}) {
  const crear = useCrearActividad();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaRealizacion, setFechaRealizacion] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setFechaRealizacion(new Date().toISOString().split("T")[0]);
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
    if (res.success && res.id) {
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
      subtitle="Registro de asistencia"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <ModalLabel htmlFor="act-nombre">Nombre de la actividad</ModalLabel>
          <ModalInput
            id="act-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <ModalLabel htmlFor="act-fecha">Fecha de la actividad</ModalLabel>
          <ModalInput
            id="act-fecha"
            type="date"
            value={fechaRealizacion}
            onChange={(e) => setFechaRealizacion(e.target.value)}
            required
          />
        </div>
        <CamposUbicacionActividad
          idPrefix="act"
          direccion={direccion}
          departamento={departamento}
          municipio={municipio}
          onDireccionChange={setDireccion}
          onDepartamentoChange={setDepartamento}
          onMunicipioChange={setMunicipio}
        />
        <div className="space-y-2">
          <ModalLabel htmlFor="act-desc">Descripción (opcional)</ModalLabel>
          <ModalTextarea
            id="act-desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </div>
        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={crear.isPending}
            className="flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            Cancelar
          </button>
          <ModalSubmit disabled={crear.isPending}>
            {crear.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar"
            )}
          </ModalSubmit>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
