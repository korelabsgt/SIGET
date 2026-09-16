"use client";

import { useMemo, useState } from "react";
import { formatFechaCompactaGt } from "@/lib/fechas-gt";
import { Check, Pencil, Plus, Save, SquarePen } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { toast } from "@/components/ui/general-modal";
import { confirmSwal } from "@/lib/confirm-destructivo";
import { cn } from "@/lib/utils";
import {
  ESTADOS_ACUERDO,
  ESTADO_ACUERDO_LABEL,
  FASES_DIALOGO,
  FASE_DIALOGO_LABEL,
  JA_PALETA,
  type FaseDialogo,
} from "./lib/catalogos";
import { etiquetaAcuerdo } from "./lib/helpers";
import { useCambiarFaseSesion } from "./lib/hooks";
import { puede } from "./lib/permisos";
import {
  JaBarras,
  JaDonut,
  JaKpiStrip,
  JaRecordCard,
  JaTable,
  JaTd,
  JaTh,
} from "./lib/ui";
import type {
  AcuerdoRecord,
  IncidenteRecord,
  RolJaPersistido,
  SesionRecord,
} from "./lib/zod";
import { CrearAcuerdo } from "./forms/CrearAcuerdo";
import { CrearSesion } from "./forms/CrearSesion";
import { VerEditarAcuerdo } from "./forms/VerEditarAcuerdo";

const COLOR_FASE: Record<FaseDialogo, string> = {
  preparatoria: JA_PALETA.gold,
  intercambio: JA_PALETA.sky,
  formal: JA_PALETA.violet,
};

const COLOR_ESTADO = {
  en_proceso: JA_PALETA.gold,
  cumplido: JA_PALETA.mint,
  incumplido: JA_PALETA.coral,
} as const;

const FASE_BADGE: Record<FaseDialogo, { bg: string; color: string; ring: string }> = {
  preparatoria: {
    bg: "bg-amber-100 dark:bg-amber-950/60",
    color: "text-amber-800 dark:text-amber-300",
    ring: "ring-amber-400/50",
  },
  intercambio: {
    bg: "bg-sky-100 dark:bg-sky-950/60",
    color: "text-sky-800 dark:text-sky-300",
    ring: "ring-sky-400/50",
  },
  formal: {
    bg: "bg-violet-100 dark:bg-violet-950/60",
    color: "text-violet-800 dark:text-violet-300",
    ring: "ring-violet-400/50",
  },
};

function faseRank(fase: FaseDialogo): number {
  return FASES_DIALOGO.indexOf(fase);
}

function FaseBarras({ fase }: { fase: FaseDialogo }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {FASES_DIALOGO.map((item) => {
        const alcanzada = faseRank(item) <= faseRank(fase);
        return (
          <span
            key={item}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              !alcanzada && "bg-zinc-200 dark:bg-zinc-700",
            )}
            style={alcanzada ? { backgroundColor: COLOR_FASE[item] } : undefined}
          />
        );
      })}
    </div>
  );
}

function FaseMarca({ fase }: { fase: FaseDialogo }) {
  const meta = FASE_BADGE[fase];
  return (
    <div className="flex min-w-44 flex-col gap-1.5">
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ring-1",
          meta.bg,
          meta.color,
          meta.ring,
        )}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: COLOR_FASE[fase] }}
        />
        {FASE_DIALOGO_LABEL[fase]}
      </span>
      <FaseBarras fase={fase} />
    </div>
  );
}

export function MesasConcertacion({
  sesiones,
  acuerdos,
  incidentes,
  rol,
}: {
  sesiones: SesionRecord[];
  acuerdos: AcuerdoRecord[];
  incidentes: IncidenteRecord[];
  rol: RolJaPersistido;
}) {
  const [crearSesion, setCrearSesion] = useState(false);
  const [crearAcuerdo, setCrearAcuerdo] = useState(false);
  const [editarAcuerdo, setEditarAcuerdo] = useState<AcuerdoRecord | null>(null);
  const cambiarFase = useCambiarFaseSesion();

  const folioPorId = useMemo(() => {
    return new Map(incidentes.map((row) => [row.id, row.folio]));
  }, [incidentes]);

  const kpis = useMemo(() => {
    const cumplidos = acuerdos.filter((a) => a.estado === "cumplido").length;
    const promedio =
      acuerdos.length === 0
        ? 0
        : Math.round(
            (acuerdos.reduce((acc, a) => acc + a.efectividad, 0) / acuerdos.length) * 10,
          ) / 10;
    return {
      sesiones: sesiones.length,
      acuerdos: acuerdos.length,
      cumplidos,
      promedio,
    };
  }, [acuerdos, sesiones.length]);

  const donaFases = FASES_DIALOGO.map((fase) => ({
    name: FASE_DIALOGO_LABEL[fase],
    value: sesiones.filter((s) => s.fase === fase).length,
    color: COLOR_FASE[fase],
  }));

  const donaEstados = ESTADOS_ACUERDO.map((estado) => ({
    name: ESTADO_ACUERDO_LABEL[estado],
    value: acuerdos.filter((a) => a.estado === estado).length,
    color: COLOR_ESTADO[estado],
  }));

  const barrasEfectividad = [1, 2, 3, 4, 5].map((n) => ({
    name: `${n}`,
    Acuerdos: acuerdos.filter((a) => a.efectividad === n).length,
  }));

  const avanzar = async (sesion: SesionRecord) => {
    const idx = FASES_DIALOGO.indexOf(sesion.fase);
    const next = FASES_DIALOGO[Math.min(idx + 1, FASES_DIALOGO.length - 1)];
    if (next === sesion.fase) {
      toast.warn("La sesión ya está en fase formal.");
      return;
    }
    const actual = FASE_DIALOGO_LABEL[sesion.fase];
    const destino = FASE_DIALOGO_LABEL[next];
    const { isConfirmed } = await confirmSwal({
      title: `¿Avanzar a ${destino}?`,
      text: `La sesión «${sesion.titulo}» está en ${actual}. Al confirmar, pasará a ${destino}.`,
      icon: "question",
      confirmButtonText: "Avanzar",
      cancelButtonText: "Cancelar",
      confirmTone: "primary",
    });
    if (!isConfirmed) return;
    const res = await cambiarFase.mutateAsync({ id: sesion.id, fase: next });
    if (res.success) {
      toast.success(`Fase actualizada a ${destino}.`);
      return;
    }
    toast.error("No se pudo actualizar la fase.");
  };

  return (
    <section className="flex flex-col gap-10">
      <JaKpiStrip
        items={[
          { label: "Sesiones", value: String(kpis.sesiones) },
          { label: "Acuerdos", value: String(kpis.acuerdos) },
          { label: "Cumplidos", value: String(kpis.cumplidos) },
          { label: "Efectividad", value: `${kpis.promedio}/5`, hint: "Promedio Likert" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <JaDonut title="Sesiones por fase" data={donaFases} centro="Mesas" />
        <JaDonut title="Estado de acuerdos" data={donaEstados} centro="Compromisos" />
        <JaBarras
          title="Escala de efectividad"
          data={barrasEfectividad}
          series={[{ key: "Acuerdos", color: JA_PALETA.gold }]}
        />
      </div>

      <div className="flex justify-end">
        {puede(rol, "sesiones.crear") ? (
          <SigetActionButton
            label="Sesión"
            accentColor={sigetAccent.crear}
            morphFrom={Plus}
            morphTo={SquarePen}
            onClick={() => setCrearSesion(true)}
            ariaLabel="Registrar sesión de diálogo"
            className="w-auto shrink-0"
          />
        ) : null}
      </div>

      <JaTable title="Sesiones de diálogo">
        <thead>
          <tr>
            <JaTh>Título</JaTh>
            <JaTh>Fase</JaTh>
            <JaTh>Territorio</JaTh>
            <JaTh>Fecha</JaTh>
            <JaTh>Incidente</JaTh>
            <JaTh />
          </tr>
        </thead>
        <tbody>
          {sesiones.map((sesion) => (
            <tr key={sesion.id}>
              <JaTd className="font-bold">{sesion.titulo}</JaTd>
              <JaTd>
                <FaseMarca fase={sesion.fase} />
              </JaTd>
              <JaTd>
                {sesion.microcuenca}
                <span className="block text-xs text-zinc-500">{sesion.municipio}</span>
              </JaTd>
              <JaTd>{formatFechaCompactaGt(sesion.fecha)}</JaTd>
              <JaTd className="font-mono text-xs">
                {folioPorId.get(sesion.incidente_id) ?? sesion.incidente_id}
              </JaTd>
              <JaTd>
                {puede(rol, "sesiones.editar") && sesion.fase !== "formal" ? (
                  <SigetActionButton
                    label="Avanzar"
                    accentColor={sigetAccent.guardar}
                    morphFrom={Save}
                    morphTo={Check}
                    onClick={() => avanzar(sesion)}
                    disabled={cambiarFase.isPending}
                    ariaLabel={`Avanzar ${sesion.titulo} a la siguiente fase de diálogo`}
                    className="w-auto shrink-0"
                  />
                ) : null}
              </JaTd>
            </tr>
          ))}
        </tbody>
      </JaTable>

      <div className="grid gap-3 md:grid-cols-2">
        {sesiones.map((sesion) => (
          <JaRecordCard
            key={sesion.id}
            kicker={FASE_DIALOGO_LABEL[sesion.fase]}
            title={sesion.titulo}
            meta={`${sesion.microcuenca} · ${sesion.municipio} · ${formatFechaCompactaGt(sesion.fecha)}`}
            tone={COLOR_FASE[sesion.fase]}
            fotos={sesion.fotos}
          >
            <p className="text-xs text-zinc-500">
              Incidente {folioPorId.get(sesion.incidente_id) ?? sesion.incidente_id}
            </p>
            {sesion.notas ? (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{sesion.notas}</p>
            ) : null}
            <div className="mt-3">
              <FaseBarras fase={sesion.fase} />
            </div>
          </JaRecordCard>
        ))}
      </div>

      <div className="flex justify-end">
        {puede(rol, "acuerdos.crear") ? (
          <SigetActionButton
            label="Acuerdo"
            accentColor={sigetAccent.crear}
            morphFrom={Plus}
            morphTo={SquarePen}
            onClick={() => setCrearAcuerdo(true)}
            ariaLabel="Registrar acuerdo"
            className="w-auto shrink-0"
          />
        ) : null}
      </div>

      <JaTable title="Bitácora de compromisos">
        <thead>
          <tr>
            <JaTh>Compromiso</JaTh>
            <JaTh>Responsable</JaTh>
            <JaTh>Límite</JaTh>
            <JaTh>Estado</JaTh>
            <JaTh>Efectividad</JaTh>
            <JaTh>Verificación</JaTh>
            <JaTh />
          </tr>
        </thead>
        <tbody>
          {acuerdos.map((row) => (
            <tr key={row.id}>
              <JaTd className="font-medium">{row.descripcion}</JaTd>
              <JaTd>{row.institucion_responsable}</JaTd>
              <JaTd>{formatFechaCompactaGt(row.fecha_limite)}</JaTd>
              <JaTd>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                    row.estado === "cumplido"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                      : row.estado === "incumplido"
                        ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                  }`}
                >
                  {etiquetaAcuerdo(row.estado)}
                </span>
              </JaTd>
              <JaTd className="font-mono font-black">{row.efectividad}/5</JaTd>
              <JaTd className="text-xs">{row.medio_verificacion}</JaTd>
              <JaTd>
                {puede(rol, "acuerdos.editar") ? (
                  <SigetActionButton
                    label="Editar"
                    accentColor={sigetAccent.editar}
                    morphFrom={Pencil}
                    morphTo={SquarePen}
                    onClick={() => setEditarAcuerdo(row)}
                    className="w-auto shrink-0"
                  />
                ) : null}
              </JaTd>
            </tr>
          ))}
        </tbody>
      </JaTable>

      <CrearSesion open={crearSesion} onOpenChange={setCrearSesion} incidentes={incidentes} />
      <CrearAcuerdo
        open={crearAcuerdo}
        onOpenChange={setCrearAcuerdo}
        sesiones={sesiones}
        incidentes={incidentes}
      />
      <VerEditarAcuerdo
        open={Boolean(editarAcuerdo)}
        onOpenChange={(open) => {
          if (!open) setEditarAcuerdo(null);
        }}
        registro={editarAcuerdo}
      />
    </section>
  );
}
