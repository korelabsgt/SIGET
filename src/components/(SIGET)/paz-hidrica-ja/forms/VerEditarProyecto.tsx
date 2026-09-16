"use client";

import { useState } from "react";
import {
  ModalShell,
  ModalLabel,
  ModalInput,
  ModalForm,
  ModalField,
  ModalSubmit,
  ModalFooter,
  ModalCancelButton,
  modalActionMessage,
  toast,
} from "@/components/ui/general-modal";
import { useEditarProyecto } from "../lib/hooks";
import { JaSelect } from "../lib/ui";
import { proyectoFormSchema, type ProyectoRecord } from "../lib/zod";
import { JaFotosCampo } from "./JaFotosCampo";

function EditarProyectoBody({
  registro,
  onClose,
}: {
  registro: ProyectoRecord;
  onClose: () => void;
}) {
  const editar = useEditarProyecto();
  const [avance, setAvance] = useState(registro.avance_fisico);
  const [ejecutado, setEjecutado] = useState(registro.presupuesto_ejecutado);
  const [representatividad, setRepresentatividad] = useState(
    registro.representatividad_comunitaria,
  );
  const [impacto, setImpacto] = useState(registro.impacto_medios_vida);
  const [innovacion, setInnovacion] = useState(registro.innovacion_climatica);
  const [fotos, setFotos] = useState<string[]>(registro.fotos ?? []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = proyectoFormSchema.safeParse({
      ...registro,
      avance_fisico: avance,
      presupuesto_ejecutado: ejecutado,
      representatividad_comunitaria: representatividad,
      impacto_medios_vida: impacto,
      innovacion_climatica: innovacion,
      fotos,
    });
    if (!parsed.success) {
      toast.warn(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }
    const res = await editar.mutateAsync({ id: registro.id, values: parsed.data });
    if (res.success) {
      toast.success("Ficha técnica actualizada.");
      onClose();
      return;
    }
    toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
  };

  return (
    <ModalForm onSubmit={handleSubmit}>
      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{registro.nombre}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField>
          <ModalLabel htmlFor="ja-pry-av">Avance físico (%)</ModalLabel>
          <ModalInput
            id="ja-pry-av"
            type="number"
            min={0}
            max={100}
            value={avance}
            onChange={(e) => setAvance(Number(e.target.value))}
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-pry-ej">Presupuesto ejecutado</ModalLabel>
          <ModalInput
            id="ja-pry-ej"
            type="number"
            min={0}
            value={ejecutado}
            onChange={(e) => setEjecutado(Number(e.target.value))}
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-pry-rep">Representatividad (%)</ModalLabel>
          <ModalInput
            id="ja-pry-rep"
            type="number"
            min={0}
            max={100}
            value={representatividad}
            onChange={(e) => setRepresentatividad(Number(e.target.value))}
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-pry-imp">Impacto en medios de vida</ModalLabel>
          <JaSelect
            id="ja-pry-imp"
            value={String(impacto)}
            onChange={(e) => setImpacto(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </JaSelect>
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-pry-inn">Innovación climática</ModalLabel>
          <JaSelect
            id="ja-pry-inn"
            value={String(innovacion)}
            onChange={(e) => setInnovacion(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </JaSelect>
        </ModalField>
      </div>
      <JaFotosCampo fotos={fotos} onChange={setFotos} disabled={editar.isPending} />
      <ModalFooter>
        <ModalCancelButton onClick={onClose} disabled={editar.isPending} />
        <ModalSubmit disabled={editar.isPending} />
      </ModalFooter>
    </ModalForm>
  );
}

export function VerEditarProyecto({
  open,
  onOpenChange,
  registro,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: ProyectoRecord | null;
}) {
  const onClose = () => onOpenChange(false);
  return (
    <ModalShell open={open} onClose={onClose} title="Actualizar ficha" maxWidth="max-w-lg">
      {open && registro ? <EditarProyectoBody registro={registro} onClose={onClose} /> : null}
    </ModalShell>
  );
}
