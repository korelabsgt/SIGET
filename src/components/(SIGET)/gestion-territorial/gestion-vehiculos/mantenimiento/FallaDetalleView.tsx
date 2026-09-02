"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Car,
  CarFront,
  CheckCircle,
  ChevronLeft,
  CircleAlert,
  CircleCheck,
  Clock,
  FileText,
  User,
  Wrench,
} from "lucide";
import { Loader2 } from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaHoraGt } from "@/lib/fechas-gt";
import { cn } from "@/lib/utils";
import {
  resolveStorageDisplaySrc,
  useSignedStorageUrls,
} from "../lib/storage-hooks";
import {
  GV_DETALLE_CARD_CLASS,
  GV_DETALLE_CHIP_CLASS,
  GV_DETALLE_NESTED_CLASS,
} from "../lib/detalle-ui";
import { type FallaRow, type MecanicoOption } from "./lib/zod";
import {
  estadoFallaBadgeClass,
  FALLA_BADGE_BASE_CLASS,
  evidenciasFalla,
  formatEstadoFallaLabel,
  formatSeveridadLabel,
  formatVehiculoFalla,
  severidadBadgeClass,
} from "./lib/helpers";
import { VerEditar } from "./forms/VerEditar";

function ChipDato({
  icon,
  hoverIcon,
  label,
  value,
}: {
  icon: typeof Car;
  hoverIcon: typeof Car;
  label: string;
  value: string;
}) {
  return (
    <div
      className={GV_DETALLE_CHIP_CLASS}
      data-morph-hover-scope
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-celeste-trifinio dark:bg-sky-950">
        <GvMorphIcon icon={icon} hoverIcon={hoverIcon} size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FilaDocumento({
  icon,
  hoverIcon,
  label,
  value,
}: {
  icon: typeof Car;
  hoverIcon: typeof Car;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border-t border-zinc-200 py-4 first:border-t-0 first:pt-0 dark:border-zinc-700">
      <span className="mt-0.5 text-zinc-400 dark:text-zinc-500">
        <GvMorphIcon icon={icon} hoverIcon={hoverIcon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
      </div>
    </div>
  );
}

function EvidenciaFallaImagen({
  path,
  src,
  onBroken,
}: {
  path: string;
  src: string;
  onBroken: () => void;
}) {
  const abrirEvidencia = () => {
    window.open(src, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={abrirEvidencia}
      className="block w-full cursor-pointer overflow-hidden rounded-xl border-0 bg-sky-50/60 p-0 dark:bg-sky-950/20"
    >
      <img
        src={src}
        alt={`Evidencia de la avería: ${path}`}
        onError={onBroken}
        className="aspect-[4/3] w-full object-cover object-center"
      />
    </button>
  );
}

function EvidenciasFalla({ paths }: { paths: string[] }) {
  const cleaned = evidenciasFalla({ evidencia_url: paths });
  const { data: signedMap = {}, isLoading, isError, refetch, isFetching } = useSignedStorageUrls(cleaned);
  const [rotas, setRotas] = useState<Record<string, boolean>>({});

  if (cleaned.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        Sin evidencia fotográfica registrada.
      </p>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-sky-50/60 dark:bg-sky-950/20">
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    );
  }

  const visibles = cleaned
    .map((path) => ({
      path,
      src: resolveStorageDisplaySrc(path, signedMap),
    }))
    .filter((item) => item.src.length > 0 && !rotas[item.path]);

  if (isError || visibles.length === 0) {
    return (
      <div className="space-y-3 rounded-xl bg-sky-50/60 p-4 dark:bg-sky-950/20">
        <p className="text-sm leading-relaxed text-muted-foreground">
          No se pudo cargar la evidencia fotográfica.
        </p>
        <button
          type="button"
          onClick={() => {
            setRotas({});
            void refetch();
          }}
          className="inline-flex cursor-pointer items-center rounded-lg border-0 bg-celeste-trifinio px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {visibles.map((item) => (
        <EvidenciaFallaImagen
          key={item.path}
          path={item.path}
          src={item.src}
          onBroken={() => setRotas((prev) => ({ ...prev, [item.path]: true }))}
        />
      ))}
    </div>
  );
}

export function FallaDetalleView({
  falla,
  mecanicos,
  isAuthorized,
  onBack,
}: {
  falla: FallaRow;
  mecanicos: MecanicoOption[];
  isAuthorized: boolean;
  onBack: () => void;
}) {
  const [accion, setAccion] = useState<"atender" | "solventar" | null>(null);
  const vehiculoNombre = formatVehiculoFalla(falla);
  const placa = falla.vehiculo?.placa?.trim() || "";
  const reportador = falla.reportador?.nombre?.trim() || "Desconocido";
  const atencion = falla.taller_externo
    ? `Taller: ${falla.taller_externo}`
    : falla.mecanico?.nombre?.trim() || "Sin asignar";

  const acciones = (() => {
    if (!isAuthorized) return null;
    if (falla.estado === "PENDIENTE") {
      return (
        <button
          type="button"
          onClick={() => setAccion("atender")}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-orange-600 px-4 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90"
        >
          <GvMorphIcon icon={Wrench} hoverIcon={Wrench} size={14} />
          Atender
        </button>
      );
    }
    if (falla.estado === "EN_REPARACION") {
      return (
        <button
          type="button"
          onClick={() => setAccion("solventar")}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-emerald-600 px-4 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90"
        >
          <GvMorphIcon icon={CheckCircle} hoverIcon={CircleCheck} size={14} />
          Solventar
        </button>
      );
    }
    return null;
  })();

  return (
    <div className="pb-8 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-9 w-fit cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-0 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:opacity-80 dark:text-zinc-400"
      >
        <GvMorphIcon icon={ArrowLeft} hoverIcon={ChevronLeft} size={16} className="text-current" />
        Regresar
      </button>

      <div className={cn("mt-4", GV_DETALLE_CARD_CLASS)}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(FALLA_BADGE_BASE_CLASS, estadoFallaBadgeClass(falla.estado))}>
                  {formatEstadoFallaLabel(falla.estado)}
                </span>
                <span className={cn(FALLA_BADGE_BASE_CLASS, severidadBadgeClass(falla.severidad))}>
                  {formatSeveridadLabel(falla.severidad)}
                </span>
              </div>
              <h1 className="mt-3 flex items-start gap-2.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
                <span className="mt-1 shrink-0 text-celeste-trifinio">
                  <GvMorphIcon icon={Car} hoverIcon={CarFront} size={28} />
                </span>
                <span className="min-w-0">
                  {placa ? (
                    <span className="block uppercase">{placa}</span>
                  ) : (
                    <span className="block capitalize">{vehiculoNombre}</span>
                  )}
                  {placa ? (
                    <span className="mt-1 block text-base font-semibold capitalize text-muted-foreground md:text-lg">
                      {vehiculoNombre}
                    </span>
                  ) : null}
                </span>
              </h1>
            </div>
            {acciones ? <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div> : null}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <ChipDato
              icon={AlertTriangle}
              hoverIcon={CircleAlert}
              label="Severidad"
              value={formatSeveridadLabel(falla.severidad)}
            />
            <ChipDato
              icon={CalendarClock}
              hoverIcon={Clock}
              label="Fecha de reporte"
              value={formatFechaHoraGt(falla.created_at)}
            />
            <ChipDato icon={User} hoverIcon={User} label="Reportado por" value={reportador} />
            <ChipDato icon={Wrench} hoverIcon={Wrench} label="Atención" value={atencion} />
          </div>

        <div className="mt-8 grid gap-8 border-t border-border pt-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.9fr)] lg:gap-12 dark:border-zinc-700">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
              Detalle de la avería
            </h2>
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Descripción
              </p>
              <p className="mt-2 max-w-prose text-[15px] leading-7 text-foreground">{falla.descripcion}</p>
            </div>
            <div className="mt-6">
              <FilaDocumento
                icon={FileText}
                hoverIcon={FileText}
                label="Diagnóstico"
                value={falla.diagnostico?.trim() || "Sin diagnóstico"}
              />
              <FilaDocumento
                icon={Wrench}
                hoverIcon={Wrench}
                label="Reparación"
                value={falla.reparacion_detalle?.trim() || "Sin detalle de reparación"}
              />
              <FilaDocumento
                icon={CalendarClock}
                hoverIcon={Clock}
                label="Solventada"
                value={falla.solventado_at ? formatFechaHoraGt(falla.solventado_at) : "Aún no solventada"}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
              Evidencia fotográfica
            </h2>
            <div className={cn("mt-4", GV_DETALLE_NESTED_CLASS)} data-morph-hover-scope>
              <EvidenciasFalla paths={falla.evidencia_url} />
            </div>
          </section>
        </div>
      </div>

      <VerEditar
        open={accion !== null}
        onClose={() => setAccion(null)}
        modo={accion}
        falla={falla}
        mecanicos={mecanicos}
      />
    </div>
  );
}
