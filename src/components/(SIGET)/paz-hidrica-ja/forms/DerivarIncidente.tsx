"use client";

import { useEffect, useMemo, useState } from "react";
import { Route } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import {
  ModalShell,
  ModalForm,
  ModalField,
  ModalFooter,
  ModalCancelButton,
  ModalInput,
  ModalLabel,
  modalAccentClass,
  modalActionMessage,
  toast,
} from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";
import { formatFechaCompactaGt } from "@/lib/fechas-gt";
import {
  DERIVACIONES,
  type DerivacionInstitucional,
} from "../lib/catalogos";
import { filtrarInstitucionesJa, institucionAsignablePorId } from "../lib/helpers";
import { useEditarIncidente } from "../lib/hooks";
import { SemaforoBadge } from "../lib/ui";
import { incidenteFormSchema, type IncidenteRecord } from "../lib/zod";

const DESTINOS: Record<
  DerivacionInstitucional,
  { titulo: string; detalle: string }
> = {
  OMAS: {
    titulo: "OMAS",
    detalle: "Agua y saneamiento",
  },
  UGAM: {
    titulo: "UGAM",
    detalle: "Gestión ambiental",
  },
  "Comités Comunitarios de Agua": {
    titulo: "Comités",
    detalle: "Agua comunitaria",
  },
};

function DerivarIncidenteBody({
  registro,
  onClose,
}: {
  registro: IncidenteRecord;
  onClose: () => void;
}) {
  const editar = useEditarIncidente();
  const [derivacion, setDerivacion] = useState(registro.derivacion);
  const [filtroInstitucion, setFiltroInstitucion] = useState("");
  const [asignadoUsuarioId, setAsignadoUsuarioId] = useState(
    registro.asignado_usuario_id ?? "",
  );
  const [asignadoA, setAsignadoA] = useState(registro.asignado_a);

  const opciones = useMemo(
    () => filtrarInstitucionesJa(derivacion, filtroInstitucion),
    [derivacion, filtroInstitucion],
  );

  useEffect(() => {
    if (!asignadoUsuarioId) return;
    const institucion = institucionAsignablePorId(asignadoUsuarioId);
    if (institucion && institucion.actor !== derivacion) {
      setAsignadoUsuarioId("");
      setAsignadoA("");
    }
  }, [asignadoUsuarioId, derivacion]);

  const cambiarActor = (actor: DerivacionInstitucional) => {
    setDerivacion(actor);
    setFiltroInstitucion("");
  };

  const folio = registro.confidencial
    ? (registro.id_anonimo ?? registro.folio)
    : registro.folio;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = incidenteFormSchema.safeParse({
      fecha: registro.fecha,
      microcuenca: registro.microcuenca,
      municipio: registro.municipio,
      criticidad: registro.criticidad,
      tipologia: registro.tipologia,
      descripcion: registro.descripcion,
      poblacion: registro.poblacion,
      confidencial: registro.confidencial,
      derivacion,
      asignado_usuario_id: asignadoUsuarioId,
      asignado_a: asignadoA,
    });
    if (!parsed.success) {
      toast.warn(parsed.error.issues[0]?.message ?? "Revisa la asignación.");
      return;
    }
    const res = await editar.mutateAsync({ id: registro.id, values: parsed.data });
    if (res.success) {
      toast.success(`Caso derivado a ${derivacion} · ${asignadoA}.`);
      onClose();
      return;
    }
    toast.error(modalActionMessage(res.error ?? undefined, "No se pudo derivar."));
  };

  return (
    <ModalForm onSubmit={handleSubmit}>
      <input
        type="hidden"
        id="ja-der-usuario"
        name="ja-der-usuario"
        value={asignadoUsuarioId}
        required={!asignadoUsuarioId}
      />

      <div className="rounded-xl bg-zinc-50 px-4 py-3.5 dark:bg-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
              {folio}
            </p>
            <p className="mt-1 text-[15px] font-semibold leading-snug text-zinc-900 dark:text-white">
              {registro.tipologia}
            </p>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              {registro.microcuenca} · {registro.municipio} ·{" "}
              {formatFechaCompactaGt(registro.fecha)}
            </p>
          </div>
          <SemaforoBadge criticidad={registro.criticidad} />
        </div>
        {registro.derivacion || registro.asignado_a ? (
          <p className="mt-3 border-t border-zinc-200/80 pt-3 text-[12px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Asignación actual:{" "}
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">
              {registro.derivacion}
              {registro.asignado_a ? ` · ${registro.asignado_a}` : ""}
            </span>
          </p>
        ) : null}
      </div>

      <ModalField>
        <p className={cn("text-sm leading-none", modalAccentClass)}>
          ¿A qué actor se envía el caso?
        </p>
        <div className="grid h-72 gap-4 md:grid-cols-[10.5rem_minmax(0,1fr)]">
          <div className="flex h-full min-h-0 flex-col gap-2.5 rounded-[20px] bg-zinc-50 p-2 dark:bg-zinc-800/80">
            {DERIVACIONES.map((item) => {
              const meta = DESTINOS[item];
              const activo = derivacion === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => cambiarActor(item)}
                  title={item}
                  className={cn(
                    "flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border px-2 py-2 text-center transition-all duration-200",
                    activo
                      ? "border-[#2c5f9b] bg-white ring-2 ring-[#2c5f9b]/20 dark:border-[#6f9fd4] dark:bg-zinc-900 dark:ring-[#6f9fd4]/25"
                      : "border-transparent bg-transparent text-zinc-600 hover:bg-white/80 dark:text-zinc-400 dark:hover:bg-zinc-900/60",
                  )}
                >
                  <span
                    className={cn(
                      "text-[13px] font-bold leading-tight",
                      activo
                        ? "text-[#2c5f9b] dark:text-[#6f9fd4]"
                        : "text-zinc-800 dark:text-zinc-200",
                    )}
                  >
                    {meta.titulo}
                  </span>
                  <span
                    className={cn(
                      "mt-1 text-[10px] font-medium leading-tight",
                      activo
                        ? "text-[#2c5f9b]/80 dark:text-[#6f9fd4]/90"
                        : "text-zinc-400 dark:text-zinc-500",
                    )}
                  >
                    {meta.detalle}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="shrink-0 border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-700">
              <ModalLabel htmlFor="ja-der-filtro" className="text-[12px]">
                Unidad institucional
              </ModalLabel>
              <ModalInput
                id="ja-der-filtro"
                value={filtroInstitucion}
                onChange={(e) => setFiltroInstitucion(e.target.value)}
                placeholder="Filtrar por nombre o municipio"
                className="mt-2 h-9"
                autoComplete="off"
              />
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
              {opciones.length === 0 ? (
                <li className="px-3 py-4 text-center text-[12px] text-zinc-500 dark:text-zinc-400">
                  No hay unidades para este actor.
                </li>
              ) : (
                opciones.map((institucion) => {
                  const activa = asignadoUsuarioId === institucion.id;
                  return (
                    <li key={institucion.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setAsignadoUsuarioId(institucion.id);
                          setAsignadoA(institucion.nombre);
                        }}
                        className={cn(
                          "flex w-full cursor-pointer flex-col px-3 py-2 text-left transition-colors",
                          activa
                            ? "bg-[#2c5f9b]/10 dark:bg-[#6f9fd4]/15"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[13px] font-semibold leading-snug",
                            activa
                              ? "text-[#2c5f9b] dark:text-[#6f9fd4]"
                              : "text-zinc-900 dark:text-zinc-100",
                          )}
                        >
                          {institucion.nombre}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {institucion.municipio}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      </ModalField>

      <ModalFooter>
        <ModalCancelButton onClick={onClose} disabled={editar.isPending} />
        <SigetActionButton
          label="Derivar"
          accentColor={sigetAccent.enlace}
          morphFrom={Route}
          morphTo={Route}
          morphOnHover={false}
          disabled={editar.isPending || !asignadoUsuarioId}
          type="submit"
          className="w-auto shrink-0"
        />
      </ModalFooter>
    </ModalForm>
  );
}

export function DerivarIncidente({
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
      title="Derivar caso"
      maxWidth="max-w-2xl"
      fullHeight
    >
      {open && registro ? (
        <DerivarIncidenteBody registro={registro} onClose={onClose} />
      ) : null}
    </ModalShell>
  );
}
