"use client";

import { useState } from "react";
import {
  ModalShell,
  ModalLabel,
  ModalInput,
  ModalTextarea,
  ModalFechaInput,
  ModalForm,
  ModalField,
  ModalSubmit,
  ModalFooter,
  ModalCancelButton,
  modalActionMessage,
  toast,
} from "@/components/ui/general-modal";
import {
  ESTADOS_ACUERDO,
  ESTADO_ACUERDO_LABEL,
  INSTITUCIONES_RESPONSABLES,
} from "../lib/catalogos";
import { useEditarAcuerdo } from "../lib/hooks";
import { JaSelect } from "../lib/ui";
import { acuerdoFormSchema, type AcuerdoRecord } from "../lib/zod";
import { JaFotosCampo } from "./JaFotosCampo";

function EditarAcuerdoBody({
  registro,
  onClose,
}: {
  registro: AcuerdoRecord;
  onClose: () => void;
}) {
  const editar = useEditarAcuerdo();
  const [descripcion, setDescripcion] = useState(registro.descripcion);
  const [institucion, setInstitucion] = useState(registro.institucion_responsable);
  const [fechaLimite, setFechaLimite] = useState(registro.fecha_limite);
  const [estado, setEstado] = useState(registro.estado);
  const [efectividad, setEfectividad] = useState(registro.efectividad);
  const [medio, setMedio] = useState(registro.medio_verificacion);
  const [fotos, setFotos] = useState<string[]>(registro.fotos ?? []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = acuerdoFormSchema.safeParse({
      sesion_id: registro.sesion_id,
      incidente_id: registro.incidente_id,
      descripcion,
      institucion_responsable: institucion,
      fecha_limite: fechaLimite,
      estado,
      efectividad,
      medio_verificacion: medio,
      fotos,
    });
    if (!parsed.success) {
      toast.warn(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }
    const res = await editar.mutateAsync({ id: registro.id, values: parsed.data });
    if (res.success) {
      toast.success("Bitácora actualizada.");
      onClose();
      return;
    }
    toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
  };

  return (
    <ModalForm onSubmit={handleSubmit}>
      <ModalField>
        <ModalLabel htmlFor="ja-eac-desc">Compromiso</ModalLabel>
        <ModalTextarea
          id="ja-eac-desc"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
        />
      </ModalField>
      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField>
          <ModalLabel htmlFor="ja-eac-inst">Institución</ModalLabel>
          <JaSelect
            id="ja-eac-inst"
            value={institucion}
            onChange={(e) =>
              setInstitucion(e.target.value as typeof institucion)
            }
          >
            {INSTITUCIONES_RESPONSABLES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </JaSelect>
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-eac-lim">Fecha límite</ModalLabel>
          <ModalFechaInput id="ja-eac-lim" value={fechaLimite} onChange={setFechaLimite} required />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-eac-est">Estado</ModalLabel>
          <JaSelect
            id="ja-eac-est"
            value={estado}
            onChange={(e) => setEstado(e.target.value as typeof estado)}
          >
            {ESTADOS_ACUERDO.map((item) => (
              <option key={item} value={item}>
                {ESTADO_ACUERDO_LABEL[item]}
              </option>
            ))}
          </JaSelect>
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-eac-efe">Efectividad (1-5)</ModalLabel>
          <JaSelect
            id="ja-eac-efe"
            value={String(efectividad)}
            onChange={(e) => setEfectividad(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </JaSelect>
        </ModalField>
      </div>
      <ModalField>
        <ModalLabel htmlFor="ja-eac-med">Medio de verificación</ModalLabel>
        <ModalInput
          id="ja-eac-med"
          value={medio}
          onChange={(e) => setMedio(e.target.value)}
        />
      </ModalField>
      <JaFotosCampo fotos={fotos} onChange={setFotos} disabled={editar.isPending} />
      <ModalFooter>
        <ModalCancelButton onClick={onClose} disabled={editar.isPending} />
        <ModalSubmit disabled={editar.isPending} />
      </ModalFooter>
    </ModalForm>
  );
}

export function VerEditarAcuerdo({
  open,
  onOpenChange,
  registro,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: AcuerdoRecord | null;
}) {
  const onClose = () => onOpenChange(false);
  return (
    <ModalShell open={open} onClose={onClose} title="Actualizar acuerdo" maxWidth="max-w-xl">
      {open && registro ? <EditarAcuerdoBody registro={registro} onClose={onClose} /> : null}
    </ModalShell>
  );
}
