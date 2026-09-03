"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  useEditarDepartamento,
  useEditarPuesto,
  useEliminarDepartamento,
  useEliminarPuesto,
  useDepartamentos,
  useEstructuraOrganizacional,
  usePuestos,
} from "../lib/hooks";
import {
  buscarNodoPorId,
  departamentoFormSchema,
  puestoFormSchema,
  type DepartamentoRecord,
  type PuestoRecord,
} from "../lib/zod";
import {
  avisoNoEliminableEstructura,
  confirmarEliminacionEstructura,
} from "../lib/swal";
import {
  EstructuraFormShell,
  FormInput,
  FormLabel,
  FormSubmitButton,
  FormFooter,
  FormTextarea,
  modalActionMessage,
} from "./EstructuraFormShell";
import { JefaturasField } from "./JefaturasField";

function EditarDepartamentoBody({
  departamento,
  onClose,
  puedeEliminar,
}: {
  departamento: DepartamentoRecord;
  onClose: () => void;
  puedeEliminar: boolean;
}) {
  const editar = useEditarDepartamento();
  const eliminar = useEliminarDepartamento();
  const { data: departamentos = [] } = useDepartamentos();
  const { data: puestos = [] } = usePuestos();

  const [nombre, setNombre] = useState(departamento.nombre);
  const [descripcion, setDescripcion] = useState(departamento.descripcion ?? "");
  const [eliminando, setEliminando] = useState(false);

  const tieneHijos = useMemo(() => {
    const subdependencias = departamentos.filter(
      (d) => d.parent_id === departamento.id,
    ).length;
    const puestosEnDep = puestos.filter(
      (p) => p.departamento_id === departamento.id,
    ).length;
    return subdependencias > 0 || puestosEnDep > 0;
  }, [departamento.id, departamentos, puestos]);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.warn("Escribe un nombre válido.");
      return;
    }
    const values = departamentoFormSchema.safeParse({
      nombre,
      parent_id: departamento.parent_id,
      descripcion,
      orden: departamento.orden,
    });
    if (!values.success) {
      toast.warn("Escribe un nombre válido.");
      return;
    }
    const res = await editar.mutateAsync({
      id: departamento.id,
      values: values.data,
    });
    if (res.success) {
      toast.success("Departamento actualizado.");
      onClose();
    } else {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
    }
  };

  const ejecutarEliminar = async () => {
    const res = await eliminar.mutateAsync(departamento.id);
    if (res.success) {
      toast.success("Departamento eliminado.");
      onClose();
      return;
    }
    toast.error(modalActionMessage(res.error ?? undefined, "No se pudo eliminar."));
  };

  const handleEliminarClick = async () => {
    if (tieneHijos) {
      await avisoNoEliminableEstructura({
        title: "No se puede eliminar",
        text: "Esta dependencia tiene subdependencias o puestos. Elimínalos o reubícalos antes de continuar.",
      });
      return;
    }

    const result = await confirmarEliminacionEstructura({
      title: "¿Eliminar dependencia?",
      text: `Se eliminará "${departamento.nombre}". Esta acción no se puede deshacer.`,
    });

    if (!result.isConfirmed) return;

    setEliminando(true);
    try {
      await ejecutarEliminar();
    } finally {
      setEliminando(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleGuardar}
      className="space-y-5"
    >
      <div className="grid gap-2">
        <FormLabel htmlFor="nombre-edit">Nombre</FormLabel>
        <FormInput
          id="nombre-edit"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <FormLabel htmlFor="descripcion-edit">
          Descripción{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </FormLabel>
        <FormTextarea
          id="descripcion-edit"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      {puedeEliminar ? (
        <button
          type="button"
          onClick={handleEliminarClick}
          disabled={eliminando || eliminar.isPending}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 text-[10px] font-bold uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {eliminando || eliminar.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Eliminar departamento
        </button>
      ) : null}

      <FormFooter>
        <FormSubmitButton disabled={editar.isPending}>
          {editar.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Guardar"
          )}
        </FormSubmitButton>
      </FormFooter>
    </motion.form>
  );
}

function EditarPuestoBody({
  puesto,
  onClose,
  puedeEliminar,
}: {
  puesto: PuestoRecord;
  onClose: () => void;
  puedeEliminar: boolean;
}) {
  const editar = useEditarPuesto();
  const eliminar = useEliminarPuesto();
  const { data: estructura } = useEstructuraOrganizacional();

  const [nombre, setNombre] = useState(puesto.nombre);
  const [jefaturaIds, setJefaturaIds] = useState(puesto.jefatura_ids);
  const [eliminando, setEliminando] = useState(false);

  const tieneHijos = useMemo(() => {
    if (!estructura) return false;
    const nodo = buscarNodoPorId(estructura, puesto.id);
    return (nodo?.hijos?.length ?? 0) > 0;
  }, [estructura, puesto.id]);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.warn("Escribe un nombre válido.");
      return;
    }
    const values = puestoFormSchema.safeParse({
      nombre,
      departamento_id: puesto.departamento_id,
      jefatura_ids: jefaturaIds,
      orden: puesto.orden,
    });
    if (!values.success) {
      toast.warn("Escribe un nombre válido.");
      return;
    }
    const res = await editar.mutateAsync({ id: puesto.id, values: values.data });
    if (res.success) {
      toast.success("Puesto actualizado.");
      onClose();
    } else {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
    }
  };

  const ejecutarEliminar = async () => {
    const res = await eliminar.mutateAsync(puesto.id);
    if (res.success) {
      toast.success("Puesto eliminado.");
      onClose();
      return;
    }
    toast.error(modalActionMessage(res.error ?? undefined, "No se pudo eliminar."));
  };

  const handleEliminarClick = async () => {
    if (tieneHijos) {
      await avisoNoEliminableEstructura({
        title: "No se puede eliminar",
        text: "Este puesto tiene dependencias o puestos bajo su cargo. Elimínalos o reubícalos antes de continuar.",
      });
      return;
    }

    const result = await confirmarEliminacionEstructura({
      title: "¿Eliminar puesto?",
      text: `Se eliminará "${puesto.nombre}". Esta acción no se puede deshacer.`,
    });

    if (!result.isConfirmed) return;

    setEliminando(true);
    try {
      await ejecutarEliminar();
    } finally {
      setEliminando(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleGuardar}
      className="space-y-5"
    >
      <div className="grid gap-2">
        <FormLabel htmlFor="nombre-edit-puesto">Nombre</FormLabel>
        <FormInput
          id="nombre-edit-puesto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <JefaturasField
        departamentoId={puesto.departamento_id ?? undefined}
        selectedIds={jefaturaIds}
        onChange={setJefaturaIds}
      />

      {puedeEliminar ? (
        <button
          type="button"
          onClick={handleEliminarClick}
          disabled={eliminando || eliminar.isPending}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 text-[10px] font-bold uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {eliminando || eliminar.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Eliminar puesto
        </button>
      ) : null}

      <FormFooter>
        <FormSubmitButton disabled={editar.isPending}>
          {editar.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Guardar"
          )}
        </FormSubmitButton>
      </FormFooter>
    </motion.form>
  );
}

export function VerEditarEstructura({
  open,
  onOpenChange,
  tipo,
  id,
  puedeEliminar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "departamento" | "puesto";
  id: string | null;
  puedeEliminar: boolean;
}) {
  const { data: departamentos = [] } = useDepartamentos();
  const { data: puestos = [] } = usePuestos();

  const departamento = departamentos.find((d) => d.id === id) ?? null;
  const puesto = puestos.find((p) => p.id === id) ?? null;
  const onClose = () => onOpenChange(false);
  const registroListo =
    tipo === "departamento" ? Boolean(departamento) : Boolean(puesto);

  return (
    <EstructuraFormShell
      open={open}
      onClose={onClose}
      title={tipo === "departamento" ? "Editar departamento" : "Editar puesto"}
      subtitle="Modificar estructura"
    >
      {open && tipo === "departamento" && departamento && (
        <EditarDepartamentoBody
          key={departamento.id}
          departamento={departamento}
          onClose={onClose}
          puedeEliminar={puedeEliminar}
        />
      )}
      {open && tipo === "puesto" && puesto && (
        <EditarPuestoBody
          key={puesto.id}
          puesto={puesto}
          onClose={onClose}
          puedeEliminar={puedeEliminar}
        />
      )}
      {open && !registroListo && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Cargando...
        </div>
      )}
    </EstructuraFormShell>
  );
}
