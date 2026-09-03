"use client";

import { Fragment, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, CirclePlus, Trash, Trash2, Save, Check } from "lucide";
import {
  ModalField,
  ModalLabel,
  ModalInput,
  toast,
} from "@/components/ui/general-modal";
import { SigetActionButton, SigetActionIcon, sigetAccent, sigetBtnSurface } from "@/components/ui/siget-action-button";
import { RippleButton } from "@/components/ui/ripple-button";
import { cn } from "@/lib/utils";
import { formatFechaActividad } from "../lib/zod";
import {
  nuevoAcuerdoId,
  crearActividadBloqueVacio,
  extraerMenciones,
  htmlATexto,
  type MinutaAcuerdo,
  type MinutaActividadBloque,
  type MinutaEstado,
  type MinutaRecord,
} from "../lib/minuta";
import { AnexosMinuta } from "./AnexosMinuta";
import { MentionTextarea } from "../MentionTextarea";
import { useElaboroMinuta, useUsuariosMinuta } from "../lib/hooks";
import type { MinutaUsuarioOpcion } from "../lib/actions";
import { useUser } from "@/components/(base)/providers/UserProvider";

function DividerEntreBloques() {
  return (
    <div
      aria-hidden
      className="flex items-center px-3 py-2.5 sm:px-5"
    >
      <div className="h-[3px] w-full rounded-full bg-celeste-trifinio" />
    </div>
  );
}

function BotonQuitarIcono({
  onClick,
  ariaLabel,
}: {
  onClick: () => void;
  ariaLabel: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <RippleButton
      type="button"
      rippleColor="#E5E7EB"
      onClick={onClick}
      aria-label={ariaLabel}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn(sigetBtnSurface, "w-auto shrink-0 px-2")}
    >
      <SigetActionIcon
        from={Trash2}
        to={Trash}
        color={sigetAccent.quitar}
        hovered={hovered}
      />
    </RippleButton>
  );
}


function DatoDocumento({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: React.ReactNode;
}) {
  return (
    <p className="text-sm leading-relaxed">
      <span className="font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">
        {etiqueta}:{" "}
      </span>
      {typeof valor === "string" ? (
        <span className="text-foreground">{valor}</span>
      ) : (
        valor
      )}
    </p>
  );
}

function ValorElaborado({ texto }: { texto: string }) {
  const separador = " | ";
  const indice = texto.indexOf(separador);
  if (indice === -1) {
    return <span className="text-foreground">{texto}</span>;
  }
  const nombre = texto.slice(0, indice);
  const puesto = texto.slice(indice + separador.length);
  return (
    <span className="text-foreground">
      {nombre}
      {separador}
      <span className="font-bold">{puesto}</span>
    </span>
  );
}

function SeccionMinuta({
  numero,
  titulo,
  accion,
  contenidoSinPx = false,
  children,
}: {
  numero?: string;
  titulo: string;
  accion?: React.ReactNode;
  contenidoSinPx?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border-2 border-zinc-300 bg-white dark:border-zinc-600 dark:bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-700 sm:px-5">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">
          {numero ? (
            <span className="shrink-0 tabular-nums">{numero}.</span>
          ) : null}
          <span className="min-w-0">{titulo}</span>
        </h2>
        {accion}
      </div>
      <div className={contenidoSinPx ? undefined : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

function SeccionMinutaConTexto({
  numero,
  titulo,
  accion,
  id,
  value,
  onChange,
  usuarios,
  minRows,
  placeholder,
  menciones = true,
}: {
  numero?: string;
  titulo: string;
  accion?: React.ReactNode;
  id: string;
  value: string;
  onChange: (value: string) => void;
  usuarios: MinutaUsuarioOpcion[];
  minRows?: number;
  placeholder?: string;
  menciones?: boolean;
}) {
  return (
    <SeccionMinuta numero={numero} titulo={titulo} accion={accion}>
      <MentionTextarea
        id={id}
        value={value}
        onChange={onChange}
        usuarios={usuarios}
        minRows={minRows}
        placeholder={placeholder}
        menciones={menciones}
      />
    </SeccionMinuta>
  );
}

function FilaTexto({
  marcador,
  value,
  onChange,
  usuarios,
  onRemove,
  placeholder,
  minRows = 3,
  menciones = true,
}: {
  marcador: string;
  value: string;
  onChange: (value: string) => void;
  usuarios: MinutaUsuarioOpcion[];
  onRemove?: () => void;
  placeholder?: string;
  minRows?: number;
  menciones?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <MentionTextarea
        value={value}
        onChange={onChange}
        usuarios={usuarios}
        minRows={minRows}
        placeholder={placeholder}
        menciones={menciones}
        marcador={marcador}
        filaAnchoCompleto
        toolbarExtra={
          onRemove ? (
            <BotonQuitarIcono onClick={onRemove} ariaLabel="Quitar línea" />
          ) : undefined
        }
      />
    </motion.div>
  );
}

function ActividadBloque({
  bloque,
  indice,
  usuarios,
  onChange,
  onRemove,
}: {
  bloque: MinutaActividadBloque;
  indice: number;
  usuarios: MinutaUsuarioOpcion[];
  onChange: (next: MinutaActividadBloque) => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="overflow-hidden border-0 bg-white dark:bg-card"
    >
      <div className="flex items-center gap-2 border-b border-zinc-200/80 bg-zinc-100/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/70 sm:px-5">
        <span className="shrink-0 text-xs font-black tabular-nums text-[#2c5f9b] dark:text-[#6f9fd4]">
          {`2.${indice + 1}`}
        </span>
        <ModalInput
          id={`actividad-titulo-${bloque.id}`}
          value={bloque.titulo}
          onChange={(e) => onChange({ ...bloque, titulo: e.target.value })}
          placeholder="Escribe el tema o unidad de la actividad"
          className="min-w-0 flex-1 bg-white dark:bg-zinc-900"
        />
        <BotonQuitarIcono
          onClick={onRemove}
          ariaLabel="Quitar bloque de actividad"
        />
      </div>

      <div>
        <AnimatePresence initial={false}>
          {bloque.items.map((item, itemIndex) => (
            <FilaTexto
              key={`${bloque.id}-item-${itemIndex}`}
              marcador={`2.${indice + 1}.${itemIndex + 1}`}
              value={item}
              usuarios={usuarios}
              minRows={2}
              onChange={(value) => {
                const items = [...bloque.items];
                items[itemIndex] = value;
                onChange({ ...bloque, items });
              }}
              onRemove={
                bloque.items.length > 1
                  ? () => {
                      const items = bloque.items.filter((_, i) => i !== itemIndex);
                      onChange({
                        ...bloque,
                        items: items.length ? items : [""],
                      });
                    }
                  : undefined
              }
              placeholder="Describe la actividad realizada."
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-center border-t border-zinc-200/80 bg-zinc-100/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/70 sm:px-5">
        <SigetActionButton
          label="Crear"
          accentColor={sigetAccent.crear}
          morphFrom={Plus}
          morphTo={CirclePlus}
          onClick={() => onChange({ ...bloque, items: [...bloque.items, ""] })}
          ariaLabel="Agregar actividad"
          className="w-auto shrink-0"
        />
      </div>
    </motion.div>
  );
}

function AcuerdoBloque({
  acuerdo,
  indice,
  usuarios,
  onChange,
  onRemove,
}: {
  acuerdo: MinutaAcuerdo;
  indice: number;
  usuarios: MinutaUsuarioOpcion[];
  onChange: (next: MinutaAcuerdo) => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="overflow-hidden border-0 bg-white dark:bg-card"
    >
      <div className="flex items-center gap-2 border-b border-zinc-200/80 bg-zinc-100/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/70 sm:px-5">
        <span className="shrink-0 text-xs font-black tabular-nums text-[#2c5f9b] dark:text-[#6f9fd4]">
          {`3.${indice + 1}`}
        </span>
        <div className="min-w-0 flex-1">
          <MentionTextarea
            id={`acuerdo-titulo-${acuerdo.id}`}
            value={
              acuerdo.titulo.trim() &&
              acuerdo.responsablesTexto.trim() &&
              acuerdo.titulo.trim() !== acuerdo.responsablesTexto.trim()
                ? `${acuerdo.titulo} ${acuerdo.responsablesTexto}`
                : acuerdo.titulo.trim() || acuerdo.responsablesTexto
            }
            onChange={(value) =>
              onChange({
                ...acuerdo,
                titulo: value,
                responsablesTexto: value,
                responsables: extraerMenciones(value),
              })
            }
            usuarios={usuarios}
            minRows={1}
            siempreNegrita
            redimensionable={false}
            placeholder="Tema, unidad y responsable; usa @ para buscar"
          />
        </div>
        <BotonQuitarIcono onClick={onRemove} ariaLabel="Quitar acuerdo" />
      </div>

      <div className="border-b border-zinc-200/80 dark:border-zinc-700">
        <div>
          <AnimatePresence initial={false}>
            {acuerdo.items.map((item, index) => (
              <FilaTexto
                key={`${acuerdo.id}-item-${index}`}
                marcador={`3.${indice + 1}.${index + 1}`}
                value={item}
                usuarios={usuarios}
                minRows={2}
                onChange={(value) => {
                  const items = [...acuerdo.items];
                  items[index] = value;
                  onChange({ ...acuerdo, items });
                }}
                onRemove={
                  acuerdo.items.length > 1
                    ? () => {
                        const items = acuerdo.items.filter(
                          (_, i) => i !== index,
                        );
                        onChange({
                          ...acuerdo,
                          items: items.length ? items : [""],
                        });
                      }
                    : undefined
                }
                placeholder="Describe el compromiso."
                menciones={false}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="flex justify-center border-t border-zinc-200/80 bg-zinc-100/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/70 sm:px-5">
          <SigetActionButton
            label="Crear"
            accentColor={sigetAccent.crear}
            morphFrom={Plus}
            morphTo={CirclePlus}
            onClick={() => onChange({ ...acuerdo, items: [...acuerdo.items, ""] })}
            ariaLabel="Agregar compromiso"
            className="w-auto shrink-0"
          />
        </div>
      </div>
    </motion.div>
  );
}

export function MinutaEditor({
  minuta,
  setMinuta,
  listo,
  onSave,
  guardando = false,
}: {
  minuta: MinutaRecord | null;
  setMinuta: Dispatch<SetStateAction<MinutaRecord>>;
  listo: boolean;
  onSave: (estado?: MinutaEstado) => void;
  guardando?: boolean;
}) {
  const { data: usuarios = [] } = useUsuariosMinuta(true);
  const { data: elaboro } = useElaboroMinuta(true);
  const user = useUser();

  const firmaSesion = (() => {
    if (elaboro?.nombre) {
      return elaboro.puesto
        ? `${elaboro.nombre} | ${elaboro.puesto}`
        : elaboro.nombre;
    }
    const nombreMeta = String(user?.user_metadata?.nombre ?? "").trim();
    return nombreMeta || "";
  })();

  useEffect(() => {
    if (!firmaSesion) return;
    setMinuta((prev) =>
      prev.elaboro === firmaSesion ? prev : { ...prev, elaboro: firmaSesion },
    );
  }, [firmaSesion, setMinuta]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave("borrador");
    toast.success("Minuta guardada.");
  };

  const actualizarAcuerdo = (id: string, next: MinutaAcuerdo) => {
    setMinuta((prev) => ({
      ...prev,
      acuerdos: prev.acuerdos.map((a) => (a.id === id ? next : a)),
    }));
  };

  if (!listo || !minuta) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-sm text-muted-foreground">Cargando minuta…</p>
      </div>
    );
  }

  return (
      <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900">
        <div className="bg-celeste-trifinio pt-1">
          <div className="rounded-t-2xl bg-card px-4 py-4 dark:bg-zinc-900 sm:px-5">
            <h1 className="text-center text-base font-black tracking-[0.12em] text-foreground sm:text-lg">
              <span className="uppercase text-[#2c5f9b] dark:text-[#6f9fd4]">
                Minuta de actividad:
              </span>{" "}
              <span className="normal-case tracking-normal">
                {minuta.actividadNombre}
              </span>
            </h1>

            <div className="mt-4 space-y-1.5 border-t border-zinc-200/80 pt-4 dark:border-zinc-700">
              <DatoDocumento
                etiqueta="Fecha"
                valor={formatFechaActividad(minuta.fecha)}
              />
              <DatoDocumento
                etiqueta="Elaborado por"
                valor={
                  firmaSesion || minuta.elaboro.trim() ? (
                    <ValorElaborado
                      texto={firmaSesion || minuta.elaboro.trim()}
                    />
                  ) : (
                    "—"
                  )
                }
              />
            </div>

            <ModalField className="mt-4 lg:flex lg:items-center lg:gap-3 lg:space-y-0">
              <ModalLabel
                htmlFor="minuta-institucion"
                className="lg:mb-0 lg:shrink-0"
              >
                Institución
              </ModalLabel>
              <ModalInput
                id="minuta-institucion"
                value={minuta.institucion}
                onChange={(e) =>
                  setMinuta((prev) => ({ ...prev, institucion: e.target.value }))
                }
                className="lg:min-w-0 lg:flex-1"
              />
            </ModalField>
          </div>
        </div>
      </div>

      <SeccionMinutaConTexto
        numero="1"
        titulo="Introducción"
        id="minuta-intro"
        value={minuta.introduccion}
        onChange={(value) =>
          setMinuta((prev) => ({ ...prev, introduccion: value }))
        }
        usuarios={usuarios}
        minRows={6}
        placeholder="Finalidad, lugar y objetivo principal de la sesión."
      />

      <SeccionMinuta
        numero="2"
        titulo="Actividades realizadas"
        contenidoSinPx
      >
        <AnimatePresence initial={false}>
          {minuta.actividadesRealizadas.map((bloque, index) => (
            <Fragment key={bloque.id}>
              {index > 0 ? <DividerEntreBloques /> : null}
              <ActividadBloque
                bloque={bloque}
                indice={index}
                usuarios={usuarios}
                onChange={(next) => {
                  setMinuta((prev) => ({
                    ...prev,
                    actividadesRealizadas: prev.actividadesRealizadas.map((b) =>
                      b.id === bloque.id ? next : b,
                    ),
                  }));
                }}
                onRemove={() => {
                  setMinuta((prev) => {
                    const actividadesRealizadas =
                      prev.actividadesRealizadas.filter((b) => b.id !== bloque.id);
                    return {
                      ...prev,
                      actividadesRealizadas: actividadesRealizadas.length
                        ? actividadesRealizadas
                        : [crearActividadBloqueVacio()],
                    };
                  });
                }}
              />
            </Fragment>
          ))}
        </AnimatePresence>
      </SeccionMinuta>

      <SeccionMinuta
        numero="3"
        titulo="Resultado y/o acuerdos alcanzados"
        contenidoSinPx
        accion={
          <SigetActionButton
            label="Crear"
            accentColor={sigetAccent.crear}
            morphFrom={Plus}
            morphTo={CirclePlus}
            onClick={() =>
              setMinuta((prev) => ({
                ...prev,
                acuerdos: [
                  ...prev.acuerdos,
                  {
                    id: nuevoAcuerdoId(),
                    titulo: "",
                    responsablesTexto: "",
                    responsables: [],
                    items: [""],
                  },
                ],
              }))
            }
            ariaLabel="Agregar acuerdo"
            className="w-auto shrink-0"
          />
        }
      >
        {minuta.acuerdos.length === 0 ? (
          <div className="border-b border-zinc-200/80 px-3 py-6 text-center dark:border-zinc-700 sm:px-5">
            <p className="text-sm font-semibold text-foreground">
              Sin acuerdos registrados
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Agrega un bloque por cada unidad que asumió compromisos.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {minuta.acuerdos.map((acuerdo, index) => (
              <Fragment key={acuerdo.id}>
                {index > 0 ? <DividerEntreBloques /> : null}
                <AcuerdoBloque
                  acuerdo={acuerdo}
                  indice={index}
                  usuarios={usuarios}
                  onChange={(next) => actualizarAcuerdo(acuerdo.id, next)}
                  onRemove={() =>
                    setMinuta((prev) => ({
                      ...prev,
                      acuerdos: prev.acuerdos.filter((a) => a.id !== acuerdo.id),
                    }))
                  }
                />
              </Fragment>
            ))}
          </AnimatePresence>
        )}

        <DividerEntreBloques />

        <div>
          <div className="border-b border-zinc-200/80 bg-zinc-100/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/70 sm:px-5">
            <p className="text-xs font-black text-[#2c5f9b] dark:text-[#6f9fd4]">
              Compromisos generales (directrices de la DEN)
            </p>
          </div>
          <MentionTextarea
            id="minuta-compromisos"
            value={minuta.compromisosGenerales}
            onChange={(value) =>
              setMinuta((prev) => ({ ...prev, compromisosGenerales: value }))
            }
            usuarios={usuarios}
            minRows={4}
            placeholder="Directrices de observancia general para todo el equipo."
            filaAnchoCompleto
          />
        </div>
      </SeccionMinuta>

      <SeccionMinuta numero="4" titulo="Anexos" contenidoSinPx>
        <MentionTextarea
          id="minuta-anexos-nota"
          value={minuta.anexosNota}
          onChange={(value) =>
            setMinuta((prev) => ({ ...prev, anexosNota: value }))
          }
          usuarios={usuarios}
          minRows={3}
          placeholder="Notas sobre las fotografías, documentos o enlaces adjuntos."
          filaAnchoCompleto
        />
        <div className="px-3 pb-3 sm:px-5">
          <AnexosMinuta
            actividadId={minuta.actividadId}
            anexos={minuta.anexos}
            onChange={(value) =>
              setMinuta((prev) => ({ ...prev, anexos: value }))
            }
          />
        </div>
      </SeccionMinuta>

      <div className="sticky bottom-4 flex justify-center pt-1">
        <SigetActionButton
          label="Guardar"
          accentColor={sigetAccent.guardar}
          morphFrom={Save}
          morphTo={Check}
          type="submit"
          disabled={guardando}
          ariaLabel="Guardar minuta"
          className="w-auto shrink-0"
        />
      </div>
      </form>
  );
}
