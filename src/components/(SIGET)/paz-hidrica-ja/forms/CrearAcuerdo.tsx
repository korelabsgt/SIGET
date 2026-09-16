"use client";

import { useState } from "react";
import { fechaCalendarioGt } from "@/lib/fechas-gt";
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
import { useCrearAcuerdo } from "../lib/hooks";
import { JaSelect } from "../lib/ui";
import { acuerdoFormSchema, type IncidenteRecord, type SesionRecord } from "../lib/zod";
import { JaFotosCampo } from "./JaFotosCampo";

function CrearAcuerdoBody({
  onClose,
  sesiones,
  incidentes,
}: {
  onClose: () => void;
  sesiones: SesionRecord[];
  incidentes: IncidenteRecord[];
}) {
  const crear = useCrearAcuerdo();
  const primera = sesiones[0];
  const [sesionId, setSesionId] = useState(primera?.id ?? "");
  const [incidenteId, setIncidenteId] = useState(primera?.incidente_id ?? incidentes[0]?.id ?? "");
  const [descripcion, setDescripcion] = useState("");
  const [institucion, setInstitucion] = useState<(typeof INSTITUCIONES_RESPONSABLES)[number]>("MARN");
  const [fechaLimite, setFechaLimite] = useState(fechaCalendarioGt());
  const [estado, setEstado] = useState<(typeof ESTADOS_ACUERDO)[number]>("en_proceso");
  const [efectividad, setEfectividad] = useState(3);
  const [medio, setMedio] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = acuerdoFormSchema.safeParse({
      sesion_id: sesionId,
      incidente_id: incidenteId,
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
    const res = await crear.mutateAsync(parsed.data);
    if (res.success) {
      toast.success("Acuerdo incorporado a la bitácora.");
      onClose();
      return;
    }
    toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
  };

  return (
    <ModalForm onSubmit={handleSubmit}>
      <ModalField>
        <ModalLabel htmlFor="ja-acu-ses">Sesión</ModalLabel>
        <JaSelect
          id="ja-acu-ses"
          value={sesionId}
          onChange={(e) => {
            const next = e.target.value;
            setSesionId(next);
            const sesion = sesiones.find((item) => item.id === next);
            if (sesion) setIncidenteId(sesion.incidente_id);
          }}
        >
          {sesiones.map((item) => (
            <option key={item.id} value={item.id}>
              {item.titulo}
            </option>
          ))}
        </JaSelect>
      </ModalField>
      <ModalField>
        <ModalLabel htmlFor="ja-acu-inc">Incidente</ModalLabel>
        <JaSelect
          id="ja-acu-inc"
          value={incidenteId}
          onChange={(e) => setIncidenteId(e.target.value)}
        >
          {incidentes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.folio} — {item.microcuenca}
            </option>
          ))}
        </JaSelect>
      </ModalField>
      <ModalField>
        <ModalLabel htmlFor="ja-acu-desc">Compromiso</ModalLabel>
        <ModalTextarea
          id="ja-acu-desc"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          required
        />
      </ModalField>
      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField>
          <ModalLabel htmlFor="ja-acu-inst">Institución responsable</ModalLabel>
          <JaSelect
            id="ja-acu-inst"
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
          <ModalLabel htmlFor="ja-acu-lim">Fecha límite</ModalLabel>
          <ModalFechaInput id="ja-acu-lim" value={fechaLimite} onChange={setFechaLimite} required />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-acu-est">Estado</ModalLabel>
          <JaSelect
            id="ja-acu-est"
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
          <ModalLabel htmlFor="ja-acu-efe">Efectividad (1-5)</ModalLabel>
          <JaSelect
            id="ja-acu-efe"
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
        <ModalLabel htmlFor="ja-acu-med">Medio de verificación</ModalLabel>
        <ModalInput
          id="ja-acu-med"
          value={medio}
          onChange={(e) => setMedio(e.target.value)}
          required
        />
      </ModalField>
      <JaFotosCampo fotos={fotos} onChange={setFotos} disabled={crear.isPending} />
      <ModalFooter>
        <ModalCancelButton onClick={onClose} disabled={crear.isPending} />
        <ModalSubmit disabled={crear.isPending} />
      </ModalFooter>
    </ModalForm>
  );
}

export function CrearAcuerdo({
  open,
  onOpenChange,
  sesiones,
  incidentes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sesiones: SesionRecord[];
  incidentes: IncidenteRecord[];
}) {
  const onClose = () => onOpenChange(false);
  return (
    <ModalShell open={open} onClose={onClose} title="Nuevo acuerdo" maxWidth="max-w-xl">
      {open && (
        <CrearAcuerdoBody onClose={onClose} sesiones={sesiones} incidentes={incidentes} />
      )}
    </ModalShell>
  );
}
