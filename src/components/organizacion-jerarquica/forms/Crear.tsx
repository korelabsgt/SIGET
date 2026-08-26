"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCrearDepartamento, useCrearPuesto, usePuestos } from "../lib/hooks";
import {
  departamentoFormSchema,
  departamentoTieneJefe,
  puestoFormSchema,
  puestosEnDepartamento,
} from "../lib/zod";
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
import { DEMO_GUARDAR_MENSAJE } from "../lib/estructura-simulada";

function CrearBody({
  tipo,
  presetParentId,
  presetDepartamentoId,
  onClose,
  modoDemo = false,
}: {
  tipo: "departamento" | "puesto";
  presetParentId: string | null;
  presetDepartamentoId?: string;
  onClose: () => void;
  modoDemo?: boolean;
}) {
  const crearDepartamento = useCrearDepartamento();
  const crearPuesto = useCrearPuesto();
  const { data: puestos = [] } = usePuestos();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [jefaturaIds, setJefaturaIds] = useState<string[]>([]);

  const guardando = crearDepartamento.isPending || crearPuesto.isPending;

  const puestosDep = useMemo(
    () =>
      presetDepartamentoId
        ? puestosEnDepartamento(puestos, presetDepartamentoId)
        : [],
    [puestos, presetDepartamentoId],
  );

  const requiereJefatura = useMemo(
    () =>
      Boolean(
        presetDepartamentoId &&
          !departamentoTieneJefe(puestos, presetDepartamentoId),
      ),
    [puestos, presetDepartamentoId],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tipo === "departamento") {
      if (!nombre.trim()) {
        toast.warn("Escribe un nombre válido para el departamento.");
        return;
      }
      if (modoDemo) {
        toast.warn(DEMO_GUARDAR_MENSAJE);
        onClose();
        return;
      }
      const values = departamentoFormSchema.safeParse({
        nombre,
        parent_id: presetParentId,
        descripcion,
        orden: 0,
      });
      if (!values.success) {
        toast.warn("Escribe un nombre válido para el departamento.");
        return;
      }
      const res = await crearDepartamento.mutateAsync(values.data);
      if (res.success) {
        toast.success("Departamento creado.");
        onClose();
      } else {
        toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
      }
      return;
    }

    if (!presetDepartamentoId) {
      toast.warn("Seleccione un departamento desde el árbol.");
      return;
    }

    if (
      !modoDemo &&
      jefaturaIds.length === 0 &&
      !departamentoTieneJefe(puestos, presetDepartamentoId)
    ) {
      toast.warn(
        puestosDep.length === 0
          ? "El primer puesto debe ser un jefe. Selecciona al menos una jefatura."
          : "Debe existir un jefe en esta dependencia antes de agregar más puestos.",
      );
      return;
    }

    if (!nombre.trim()) {
      toast.warn("Escribe un nombre válido para el puesto.");
      return;
    }
    if (modoDemo) {
      toast.warn(DEMO_GUARDAR_MENSAJE);
      onClose();
      return;
    }

    const values = puestoFormSchema.safeParse({
      nombre,
      departamento_id: presetDepartamentoId,
      jefatura_ids: jefaturaIds,
      orden: 0,
    });
    if (!values.success) {
      toast.warn("Escribe un nombre válido para el puesto.");
      return;
    }
    const res = await crearPuesto.mutateAsync(values.data);
    if (res.success) {
      toast.success("Puesto creado.");
      onClose();
    } else {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="grid gap-2">
        <FormLabel htmlFor="nombre">Nombre</FormLabel>
        <FormInput
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoFocus
        />
      </div>

      {tipo === "departamento" && (
        <div className="grid gap-2">
          <FormLabel htmlFor="descripcion">
            Descripción{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </FormLabel>
          <FormTextarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
      )}

      {tipo === "puesto" && !modoDemo && (
        <>
          {requiereJefatura && (
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {puestosDep.length === 0
                ? "El primer puesto debe ser un jefe. Selecciona al menos una jefatura."
                : "Debe existir un jefe en esta dependencia. Asigna al menos una jefatura al nuevo puesto."}
            </p>
          )}
          <JefaturasField
            departamentoId={presetDepartamentoId}
            selectedIds={jefaturaIds}
            onChange={setJefaturaIds}
            required={requiereJefatura}
          />
        </>
      )}

      {tipo === "puesto" && modoDemo && (
        <p className="text-xs text-muted-foreground">
          En producción aquí se asignan las jefaturas del nuevo puesto.
        </p>
      )}

      <FormFooter>
        <FormSubmitButton disabled={guardando} label="Guardar" />
      </FormFooter>
    </motion.form>
  );
}

export function CrearEstructura({
  open,
  onOpenChange,
  tipo,
  presetParentId = null,
  presetDepartamentoId,
  modoDemo = false,
  nombreEmpresaDemo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "departamento" | "puesto";
  presetParentId?: string | null;
  presetDepartamentoId?: string;
  modoDemo?: boolean;
  nombreEmpresaDemo?: string;
}) {
  const onClose = () => onOpenChange(false);
  const empresaLabel = nombreEmpresaDemo ?? "Plan Trifinio";

  return (
    <EstructuraFormShell
      open={open}
      onClose={onClose}
      title={tipo === "departamento" ? "Nuevo departamento" : "Nuevo puesto"}
      subtitle={
        modoDemo
          ? "Vista demo · sin guardar cambios"
          : tipo === "departamento"
            ? presetParentId
              ? "Dentro de unidad existente"
              : `Dentro de ${empresaLabel}`
            : "Asignación de puesto"
      }
    >
      {open && (
        <CrearBody
          key={`${tipo}-${presetParentId ?? "root"}-${presetDepartamentoId ?? ""}-${modoDemo ? "demo" : "live"}`}
          tipo={tipo}
          presetParentId={presetParentId}
          presetDepartamentoId={presetDepartamentoId}
          onClose={onClose}
          modoDemo={modoDemo}
        />
      )}
    </EstructuraFormShell>
  );
}
