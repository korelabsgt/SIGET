"use client";

import { useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  CRITICIDADES,
  CRITICIDAD_SELECT_LABEL,
  DERIVACIONES,
  MICROCUENCAS,
  TIPOLOGIAS,
} from "../lib/catalogos";
import { emptyIncidenteForm, municipioDeMicrocuenca } from "../lib/helpers";
import { useCrearIncidente } from "../lib/hooks";
import { JaSelect } from "../lib/ui";
import { incidenteFormSchema } from "../lib/zod";
import { ResponsableUsuarioSelect } from "./ResponsableUsuarioSelect";
import { JaFotosCampo } from "./JaFotosCampo";

function CrearIncidenteBody({ onClose }: { onClose: () => void }) {
  const crear = useCrearIncidente();
  const inicial = useMemo(() => emptyIncidenteForm(fechaCalendarioGt()), []);
  const [fecha, setFecha] = useState(inicial.fecha);
  const [microcuenca, setMicrocuenca] = useState(inicial.microcuenca);
  const [municipio, setMunicipio] = useState(inicial.municipio);
  const [criticidad, setCriticidad] = useState(inicial.criticidad);
  const [tipologia, setTipologia] = useState(inicial.tipologia);
  const [descripcion, setDescripcion] = useState(inicial.descripcion);
  const [hombres, setHombres] = useState(0);
  const [mujeres, setMujeres] = useState(0);
  const [juventudes, setJuventudes] = useState(0);
  const [chorti, setChorti] = useState(0);
  const [confidencial, setConfidencial] = useState(false);
  const [derivacion, setDerivacion] = useState(inicial.derivacion);
  const [asignadoUsuarioId, setAsignadoUsuarioId] = useState("");
  const [asignadoA, setAsignadoA] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = incidenteFormSchema.safeParse({
      fecha,
      microcuenca,
      municipio,
      criticidad,
      tipologia,
      descripcion,
      poblacion: {
        hombres,
        mujeres,
        juventudes,
        pueblo_maya_chorti: chorti,
      },
      confidencial,
      derivacion,
      asignado_usuario_id: asignadoUsuarioId,
      asignado_a: asignadoA,
      fotos,
    });
    if (!parsed.success) {
      toast.warn(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }
    const res = await crear.mutateAsync(parsed.data);
    if (res.success) {
      toast.success(
        confidencial
          ? "Tensión registrada con reserva de identidad."
          : "Tensión hídrica registrada.",
      );
      onClose();
      return;
    }
    toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
  };

  return (
    <ModalForm onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField>
          <ModalLabel htmlFor="ja-inc-fecha">Fecha</ModalLabel>
          <ModalFechaInput id="ja-inc-fecha" value={fecha} onChange={setFecha} required />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-inc-micro">Microcuenca</ModalLabel>
          <JaSelect
            id="ja-inc-micro"
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
          <ModalLabel htmlFor="ja-inc-muni">Municipio</ModalLabel>
          <ModalInput id="ja-inc-muni" value={municipio} readOnly />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-inc-crit">Criticidad</ModalLabel>
          <JaSelect
            id="ja-inc-crit"
            value={criticidad}
            onChange={(e) => setCriticidad(e.target.value as typeof criticidad)}
          >
            {CRITICIDADES.map((item) => (
              <option key={item} value={item}>
                {CRITICIDAD_SELECT_LABEL[item]}
              </option>
            ))}
          </JaSelect>
        </ModalField>
      </div>

      <ModalField>
        <ModalLabel htmlFor="ja-inc-tipo">Tipología diagnóstica</ModalLabel>
        <JaSelect
          id="ja-inc-tipo"
          value={tipologia}
          onChange={(e) => setTipologia(e.target.value as typeof tipologia)}
        >
          {TIPOLOGIAS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </JaSelect>
      </ModalField>

      <ModalField>
        <ModalLabel htmlFor="ja-inc-desc">Descripción de la tensión</ModalLabel>
        <ModalTextarea
          id="ja-inc-desc"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          required
        />
      </ModalField>

      <div>
        <p className="mb-2 text-sm font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">
          Desagregación demográfica
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModalField>
            <ModalLabel htmlFor="ja-inc-h">Hombres</ModalLabel>
            <ModalInput
              id="ja-inc-h"
              type="number"
              min={0}
              value={hombres}
              onChange={(e) => setHombres(Number(e.target.value))}
              required
            />
          </ModalField>
          <ModalField>
            <ModalLabel htmlFor="ja-inc-m">Mujeres</ModalLabel>
            <ModalInput
              id="ja-inc-m"
              type="number"
              min={0}
              value={mujeres}
              onChange={(e) => setMujeres(Number(e.target.value))}
              required
            />
          </ModalField>
          <ModalField>
            <ModalLabel htmlFor="ja-inc-j">Juventudes</ModalLabel>
            <ModalInput
              id="ja-inc-j"
              type="number"
              min={0}
              value={juventudes}
              onChange={(e) => setJuventudes(Number(e.target.value))}
              required
            />
          </ModalField>
          <ModalField>
            <ModalLabel htmlFor="ja-inc-c">Pueblo Maya Ch&apos;orti&apos;</ModalLabel>
            <ModalInput
              id="ja-inc-c"
              type="number"
              min={0}
              value={chorti}
              onChange={(e) => setChorti(Number(e.target.value))}
              required
            />
          </ModalField>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <ModalLabel htmlFor="ja-inc-conf">Acción Sin Daño</ModalLabel>
          <Switch
            id="ja-inc-conf"
            checked={confidencial}
            onCheckedChange={setConfidencial}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          La reserva de identidad protege a denunciantes, defensores ambientales, mujeres y
          juventudes. Al activarla se genera un ID anónimo y se omite cualquier dato nominal
          en listados y exportaciones.
        </p>
      </div>

      <ModalField>
        <ModalLabel htmlFor="ja-inc-der">Primera respuesta</ModalLabel>
        <JaSelect
          id="ja-inc-der"
          value={derivacion}
          onChange={(e) => setDerivacion(e.target.value as typeof derivacion)}
        >
          {DERIVACIONES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </JaSelect>
      </ModalField>

      <ModalField>
        <ResponsableUsuarioSelect
          id="ja-inc-usuario"
          value={asignadoUsuarioId}
          actor={derivacion}
          required
          onChange={(institucionId, nombre) => {
            setAsignadoUsuarioId(institucionId);
            setAsignadoA(nombre);
          }}
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

export function CrearIncidente({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const onClose = () => onOpenChange(false);
  return (
    <ModalShell open={open} onClose={onClose} title="Registrar tensión hídrica" maxWidth="max-w-2xl">
      {open && <CrearIncidenteBody onClose={onClose} />}
    </ModalShell>
  );
}
