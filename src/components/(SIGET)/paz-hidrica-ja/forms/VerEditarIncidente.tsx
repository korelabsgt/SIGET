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
import { Switch } from "@/components/ui/switch";
import {
  CRITICIDADES,
  CRITICIDAD_SELECT_LABEL,
  DERIVACIONES,
  MICROCUENCAS,
  TIPOLOGIAS,
} from "../lib/catalogos";
import { municipioDeMicrocuenca } from "../lib/helpers";
import { useEditarIncidente } from "../lib/hooks";
import { JaSelect } from "../lib/ui";
import { incidenteFormSchema, type IncidenteRecord } from "../lib/zod";
import { ResponsableUsuarioSelect } from "./ResponsableUsuarioSelect";
import { JaFotosCampo } from "./JaFotosCampo";

function EditarIncidenteBody({
  registro,
  onClose,
}: {
  registro: IncidenteRecord;
  onClose: () => void;
}) {
  const editar = useEditarIncidente();
  const [fecha, setFecha] = useState(registro.fecha);
  const [microcuenca, setMicrocuenca] = useState(registro.microcuenca);
  const [municipio, setMunicipio] = useState(registro.municipio);
  const [criticidad, setCriticidad] = useState(registro.criticidad);
  const [tipologia, setTipologia] = useState(registro.tipologia);
  const [descripcion, setDescripcion] = useState(registro.descripcion);
  const [hombres, setHombres] = useState(registro.poblacion.hombres);
  const [mujeres, setMujeres] = useState(registro.poblacion.mujeres);
  const [juventudes, setJuventudes] = useState(registro.poblacion.juventudes);
  const [chorti, setChorti] = useState(registro.poblacion.pueblo_maya_chorti);
  const [confidencial, setConfidencial] = useState(registro.confidencial);
  const [derivacion, setDerivacion] = useState(registro.derivacion);
  const [asignadoUsuarioId, setAsignadoUsuarioId] = useState(
    registro.asignado_usuario_id ?? "",
  );
  const [asignadoA, setAsignadoA] = useState(registro.asignado_a);
  const [fotos, setFotos] = useState<string[]>(registro.fotos ?? []);

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
    const res = await editar.mutateAsync({ id: registro.id, values: parsed.data });
    if (res.success) {
      toast.success("Incidente actualizado.");
      onClose();
      return;
    }
    toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
  };

  return (
    <ModalForm onSubmit={handleSubmit}>
      {registro.id_anonimo ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          ID anónimo: {registro.id_anonimo}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField>
          <ModalLabel htmlFor="ja-edi-fecha">Fecha</ModalLabel>
          <ModalFechaInput
            id="ja-edi-fecha"
            value={fecha}
            onChange={setFecha}
            required
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-edi-micro">Microcuenca</ModalLabel>
          <JaSelect
            id="ja-edi-micro"
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
          <ModalLabel htmlFor="ja-edi-muni">Municipio</ModalLabel>
          <ModalInput id="ja-edi-muni" value={municipio} readOnly />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-edi-crit">Criticidad</ModalLabel>
          <JaSelect
            id="ja-edi-crit"
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
        <ModalLabel htmlFor="ja-edi-tipo">Tipología diagnóstica</ModalLabel>
        <JaSelect
          id="ja-edi-tipo"
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
        <ModalLabel htmlFor="ja-edi-desc">Descripción</ModalLabel>
        <ModalTextarea
          id="ja-edi-desc"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
        />
      </ModalField>

      <div className="grid gap-3 sm:grid-cols-2">
        <ModalField>
          <ModalLabel htmlFor="ja-edi-h">Hombres</ModalLabel>
          <ModalInput
            id="ja-edi-h"
            type="number"
            min={0}
            value={hombres}
            onChange={(e) => setHombres(Number(e.target.value))}
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-edi-m">Mujeres</ModalLabel>
          <ModalInput
            id="ja-edi-m"
            type="number"
            min={0}
            value={mujeres}
            onChange={(e) => setMujeres(Number(e.target.value))}
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-edi-j">Juventudes</ModalLabel>
          <ModalInput
            id="ja-edi-j"
            type="number"
            min={0}
            value={juventudes}
            onChange={(e) => setJuventudes(Number(e.target.value))}
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="ja-edi-c">Pueblo Maya Ch&apos;orti&apos;</ModalLabel>
          <ModalInput
            id="ja-edi-c"
            type="number"
            min={0}
            value={chorti}
            onChange={(e) => setChorti(Number(e.target.value))}
          />
        </ModalField>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
        <ModalLabel htmlFor="ja-edi-conf">Acción Sin Daño</ModalLabel>
        <Switch
          id="ja-edi-conf"
          checked={confidencial}
          onCheckedChange={setConfidencial}
        />
      </div>

      <ModalField>
        <ModalLabel htmlFor="ja-edi-der">Primera respuesta</ModalLabel>
        <JaSelect
          id="ja-edi-der"
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
          id="ja-edi-usuario"
          value={asignadoUsuarioId}
          actor={derivacion}
          required
          onChange={(institucionId, nombre) => {
            setAsignadoUsuarioId(institucionId);
            setAsignadoA(nombre);
          }}
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

export function VerEditarIncidente({
  open,
  onOpenChange,
  registro,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: IncidenteRecord | null;
}) {
  const onClose = () => onOpenChange(false);
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Editar incidente"
      maxWidth="max-w-2xl"
    >
      {open && registro ? (
        <EditarIncidenteBody registro={registro} onClose={onClose} />
      ) : null}
    </ModalShell>
  );
}
