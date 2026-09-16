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
import { FASES_DIALOGO, FASE_DIALOGO_LABEL, MICROCUENCAS } from "../lib/catalogos";
import { municipioDeMicrocuenca } from "../lib/helpers";
import { useCrearSesion } from "../lib/hooks";
import { JaSelect } from "../lib/ui";
import { sesionFormSchema, type IncidenteRecord } from "../lib/zod";
import { JaFotosCampo } from "./JaFotosCampo";

function CrearSesionBody({
  onClose,
  incidentes,
}: {
  onClose: () => void;
  incidentes: IncidenteRecord[];
}) {
  const crear = useCrearSesion();
  const primero = incidentes[0];
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(fechaCalendarioGt());
  const [microcuenca, setMicrocuenca] = useState(primero?.microcuenca ?? "Muyurco");
  const [municipio, setMunicipio] = useState(primero?.municipio ?? "Camotán");
  const [fase, setFase] = useState<(typeof FASES_DIALOGO)[number]>("preparatoria");
  const [incidenteId, setIncidenteId] = useState(primero?.id ?? "");
  const [notas, setNotas] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = sesionFormSchema.safeParse({
      titulo,
      fecha,
      microcuenca,
      municipio,
      fase,
      incidente_id: incidenteId,
      notas,
      fotos,
    });
    if (!parsed.success) {
      toast.warn(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }
    const res = await crear.mutateAsync(parsed.data);
    if (res.success) {
      toast.success("Sesión de diálogo registrada.");
      onClose();
      return;
    }
    toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
  };

  return (
    <ModalForm onSubmit={handleSubmit}>
      <ModalField>
        <ModalLabel htmlFor="ja-ses-tit">Título</ModalLabel>
        <ModalInput
          id="ja-ses-tit"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          autoFocus
        />
      </ModalField>
      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField>
          <ModalLabel htmlFor="ja-ses-fecha">Fecha</ModalLabel>
          <ModalFechaInput id="ja-ses-fecha" value={fecha} onChange={setFecha} required />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-ses-fase">Fase</ModalLabel>
          <JaSelect
            id="ja-ses-fase"
            value={fase}
            onChange={(e) => setFase(e.target.value as typeof fase)}
          >
            {FASES_DIALOGO.map((item) => (
              <option key={item} value={item}>
                {FASE_DIALOGO_LABEL[item]}
              </option>
            ))}
          </JaSelect>
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-ses-micro">Microcuenca</ModalLabel>
          <JaSelect
            id="ja-ses-micro"
            value={microcuenca}
            onChange={(e) => {
              const next = e.target.value as typeof microcuenca;
              setMicrocuenca(next);
              setMunicipio(municipioDeMicrocuenca(next));
            }}
          >
            {MICROCUENCAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </JaSelect>
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-ses-muni">Municipio</ModalLabel>
          <ModalInput id="ja-ses-muni" value={municipio} readOnly />
        </ModalField>
      </div>
      <ModalField>
        <ModalLabel htmlFor="ja-ses-inc">Incidente vinculado</ModalLabel>
        <JaSelect
          id="ja-ses-inc"
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
        <ModalLabel htmlFor="ja-ses-notas">Notas</ModalLabel>
        <ModalTextarea
          id="ja-ses-notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
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

export function CrearSesion({
  open,
  onOpenChange,
  incidentes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentes: IncidenteRecord[];
}) {
  const onClose = () => onOpenChange(false);
  return (
    <ModalShell open={open} onClose={onClose} title="Nueva sesión de diálogo" maxWidth="max-w-xl">
      {open && <CrearSesionBody onClose={onClose} incidentes={incidentes} />}
    </ModalShell>
  );
}
