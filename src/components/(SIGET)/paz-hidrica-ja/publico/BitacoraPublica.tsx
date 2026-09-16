"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide";
import { formatFechaCompactaGt } from "@/lib/fechas-gt";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { toast } from "@/components/ui/general-modal";
import {
  ESTADOS_ACUERDO,
  ESTADO_ACUERDO_LABEL,
  INSTITUCIONES_RESPONSABLES,
  type EstadoAcuerdo,
  type InstitucionResponsable,
} from "../lib/catalogos";
import { filtroTexto } from "../lib/helpers";
import { descargarActaPublica } from "../lib/publico-pdf";
import { JaRecordCard, JaSelect } from "../lib/ui";
import type { AcuerdoRecord } from "../lib/zod";
import { cn } from "@/lib/utils";
import { modalFieldClass } from "@/components/ui/general-modal";

const COLOR_ESTADO: Record<EstadoAcuerdo, string> = {
  cumplido: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  en_proceso: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  incumplido: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
};

function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${valor} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn("text-sm", i < valor ? "text-[#C59B27]" : "text-zinc-300 dark:text-zinc-600")}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function BitacoraPublica({ acuerdos }: { acuerdos: AcuerdoRecord[] }) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoAcuerdo | "todos">("todos");
  const [actor, setActor] = useState<InstitucionResponsable | "todos">("todos");

  const filtrados = useMemo(() => {
    return acuerdos.filter((row) => {
      if (estado !== "todos" && row.estado !== estado) return false;
      if (actor !== "todos" && row.institucion_responsable !== actor) return false;
      if (!filtroTexto(`${row.descripcion} ${row.institucion_responsable} ${row.medio_verificacion}`, q)) {
        return false;
      }
      return true;
    });
  }, [acuerdos, actor, estado, q]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#003882] dark:text-[#6f9fd4]">
            Buscar
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={cn(
              "flex h-10 w-full rounded-lg bg-white px-3 text-sm outline-none dark:bg-zinc-900",
              modalFieldClass,
            )}
            aria-label="Buscar acuerdos"
          />
        </label>
        <div>
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-[#003882] dark:text-[#6f9fd4]">
            Estado
          </p>
          <JaSelect
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoAcuerdo | "todos")}
          >
            <option value="todos">Todos</option>
            {ESTADOS_ACUERDO.map((item) => (
              <option key={item} value={item}>
                {ESTADO_ACUERDO_LABEL[item]}
              </option>
            ))}
          </JaSelect>
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-[#003882] dark:text-[#6f9fd4]">
            Responsable
          </p>
          <JaSelect
            value={actor}
            onChange={(e) => setActor(e.target.value as InstitucionResponsable | "todos")}
          >
            <option value="todos">Todos</option>
            {INSTITUCIONES_RESPONSABLES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </JaSelect>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtrados.map((row) => (
          <JaRecordCard
            key={row.id}
            kicker={row.institucion_responsable}
            title={row.descripcion}
            meta={`${row.medio_verificacion}`}
            fecha={formatFechaCompactaGt(row.fecha_limite)}
          >
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                  COLOR_ESTADO[row.estado],
                )}
              >
                {ESTADO_ACUERDO_LABEL[row.estado]}
              </span>
              <Estrellas valor={row.efectividad} />
              <SigetActionButton
                label="Acta"
                accentColor={sigetAccent.excel}
                morphFrom={FileText}
                morphTo={Download}
                onClick={() => {
                  descargarActaPublica(row);
                  toast.success("Acta pública descargada.");
                }}
                ariaLabel="Descargar acta pública"
                className="w-auto shrink-0"
              />
            </div>
          </JaRecordCard>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-[28px] bg-white px-6 py-10 text-center text-sm text-zinc-500 dark:bg-zinc-900">
          No hay acuerdos con esos filtros.
        </p>
      ) : null}
    </div>
  );
}
