"use client";

import { useState } from "react";
import { ArrowLeft, ChevronLeft } from "lucide";
import {
  Car,
  CheckCircle,
  FileText,
  Flag,
  ImageIcon,
  Loader2,
  Wrench,
} from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import { cn } from "@/lib/utils";
import {
  resolveStorageDisplaySrc,
  useSignedStorageUrls,
} from "../lib/storage-hooks";
import { GV_DETALLE_CARD_CLASS } from "../lib/detalle-ui";
import {
  GvDetalleCerrar,
  GvDetalleFilaIcono,
  GvDetalleSeccionTitulo,
  GvDetalleStat,
  GvDetalleTarjetaAnidada,
} from "../lib/gv-detalle-modal-ui";
import { type FallaRow, type MecanicoOption } from "./lib/zod";
import {
  evidenciasFalla,
  formatSeveridadLabel,
  formatVehiculoFalla,
  severidadBadgeClass,
} from "./lib/helpers";
import { VerEditar } from "./forms/VerEditar";

function EvidenciaFallaImagen({
  path,
  src,
  onBroken,
}: {
  path: string;
  src: string;
  onBroken: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => window.open(src, "_blank", "noopener,noreferrer")}
      className="block w-full cursor-pointer overflow-hidden rounded-xl border-0 bg-zinc-200/60 p-0 dark:bg-zinc-900/60"
    >
      <img
        src={src}
        alt={`Evidencia: ${path}`}
        onError={onBroken}
        className="aspect-[4/3] w-full object-cover object-center"
      />
    </button>
  );
}

function EvidenciasFallaEmbedded({ paths }: { paths: string[] }) {
  const cleaned = evidenciasFalla({ evidencia_url: paths });
  const { data: signedMap = {}, isLoading, isError, refetch, isFetching } = useSignedStorageUrls(cleaned);
  const [rotas, setRotas] = useState<Record<string, boolean>>({});

  if (cleaned.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl bg-zinc-200/60 dark:bg-zinc-900/60">
        <ImageIcon className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">Sin evidencia fotográfica</p>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-zinc-200/60 dark:bg-zinc-900/60">
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
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-xl bg-zinc-200/60 p-4 dark:bg-zinc-900/60">
        <p className="text-sm text-muted-foreground">No se pudo cargar la evidencia.</p>
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

  if (visibles.length === 1) {
    return (
      <EvidenciaFallaImagen
        path={visibles[0].path}
        src={visibles[0].src}
        onBroken={() => setRotas((prev) => ({ ...prev, [visibles[0].path]: true }))}
      />
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

function AccionesFalla({
  falla,
  isAuthorized,
  anchoCompleto,
  onAtender,
  onSolventar,
}: {
  falla: FallaRow;
  isAuthorized: boolean;
  anchoCompleto?: boolean;
  onAtender: () => void;
  onSolventar: () => void;
}) {
  if (!isAuthorized) return null;

  const btnBase = cn(
    "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 text-[11px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90",
    anchoCompleto ? "h-12" : "h-9 px-4",
  );

  if (falla.estado === "PENDIENTE") {
    return (
      <button type="button" onClick={onAtender} className={cn(btnBase, "bg-amber-500 dark:bg-amber-600")}>
        <Wrench size={16} strokeWidth={2.5} />
        Atender
      </button>
    );
  }

  if (falla.estado === "EN_REPARACION") {
    return (
      <button type="button" onClick={onSolventar} className={cn(btnBase, "bg-emerald-500 dark:bg-emerald-600")}>
        <CheckCircle size={16} strokeWidth={2.5} />
        Solventar
      </button>
    );
  }

  return null;
}

function ContenidoFalla({
  falla,
  isAuthorized,
  embedded,
  onClose,
  onAtender,
  onSolventar,
}: {
  falla: FallaRow;
  isAuthorized: boolean;
  embedded: boolean;
  onClose?: () => void;
  onAtender: () => void;
  onSolventar: () => void;
}) {
  const vehiculoNombre = formatVehiculoFalla(falla);
  const placa = falla.vehiculo?.placa?.trim() || "";
  const reportador = falla.reportador?.nombre?.trim() || "Desconocido";
  const atencion = falla.taller_externo
    ? falla.taller_externo
    : falla.mecanico?.nombre?.trim() || "Sin asignar";
  const solventada = Boolean(falla.solventado_at);

  const acciones = (
    <AccionesFalla
      falla={falla}
      isAuthorized={isAuthorized}
      anchoCompleto={embedded}
      onAtender={onAtender}
      onSolventar={onSolventar}
    />
  );

  if (embedded) {
    return (
      <div className="space-y-5 pb-2">
        <div className="relative space-y-1 pr-12">
          {onClose ? <GvDetalleCerrar onClose={onClose} /> : null}
          <div className="flex items-start gap-2.5">
            <Car className="mt-1 size-6 shrink-0 text-celeste-trifinio" strokeWidth={2.25} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black uppercase tracking-tight text-foreground md:text-[1.65rem]">
                  {placa || vehiculoNombre}
                </h1>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    severidadBadgeClass(falla.severidad),
                  )}
                >
                  {formatSeveridadLabel(falla.severidad)}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {vehiculoNombre} · Reportada por {reportador},{" "}
                {formatFechaHoraGv(falla.created_at)}
              </p>
            </div>
          </div>
        </div>

        {acciones ? <div>{acciones}</div> : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <GvDetalleStat label="Severidad" value={formatSeveridadLabel(falla.severidad)} />
          <GvDetalleStat label="Reportado" value={formatFechaHoraGv(falla.created_at)} />
          <GvDetalleStat label="Atención" value={atencion} />
        </div>

        <div className="grid gap-8 border-t border-zinc-200 pt-6 dark:border-zinc-700/80 lg:grid-cols-[minmax(0,1.55fr)_minmax(14rem,1fr)] lg:gap-10">
          <section>
            <GvDetalleSeccionTitulo>Detalle de la avería</GvDetalleSeccionTitulo>
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Descripción
              </p>
              <p className="mt-2 text-[15px] font-semibold leading-7 text-foreground">{falla.descripcion}</p>
            </div>
            <div className="mt-2">
              <GvDetalleFilaIcono
                icon={FileText}
                label="Diagnóstico"
                value={falla.diagnostico?.trim() || "Sin diagnóstico"}
              />
              <GvDetalleFilaIcono
                icon={Wrench}
                label="Reparación"
                value={falla.reparacion_detalle?.trim() || "Sin detalle de reparación"}
              />
              <GvDetalleFilaIcono
                icon={Flag}
                label="Solventada"
                value={solventada ? formatFechaHoraGv(falla.solventado_at) : "Aún no solventada"}
                valorClassName={
                  solventada ? "font-semibold text-foreground" : "font-medium text-red-600 dark:text-red-400"
                }
              />
            </div>
          </section>

          <section>
            <GvDetalleSeccionTitulo>Evidencia fotográfica</GvDetalleSeccionTitulo>
            <div className="mt-4">
              <EvidenciasFallaEmbedded paths={falla.evidencia_url} />
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={GV_DETALLE_CARD_CLASS}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-start gap-2.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            <span className="mt-1 shrink-0 text-celeste-trifinio">
              <Car size={28} strokeWidth={2.25} />
            </span>
            <span className="min-w-0 uppercase">{placa || vehiculoNombre}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Reportada por {reportador} · {formatFechaHoraGv(falla.created_at)}
          </p>
        </div>
        {acciones ? <div className="flex shrink-0">{acciones}</div> : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <GvDetalleStat label="Severidad" value={formatSeveridadLabel(falla.severidad)} />
        <GvDetalleStat label="Reportado" value={formatFechaHoraGv(falla.created_at)} />
        <GvDetalleStat label="Atención" value={atencion} />
      </div>

      <div className="mt-8 grid gap-8 border-t border-border pt-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.9fr)] lg:gap-12 dark:border-zinc-700">
        <section>
          <GvDetalleSeccionTitulo>Detalle de la avería</GvDetalleSeccionTitulo>
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descripción</p>
            <p className="mt-2 max-w-prose text-[15px] leading-7 text-foreground">{falla.descripcion}</p>
          </div>
          <div className="mt-2">
            <GvDetalleFilaIcono
              icon={FileText}
              label="Diagnóstico"
              value={falla.diagnostico?.trim() || "Sin diagnóstico"}
            />
            <GvDetalleFilaIcono
              icon={Wrench}
              label="Reparación"
              value={falla.reparacion_detalle?.trim() || "Sin detalle de reparación"}
            />
            <GvDetalleFilaIcono
              icon={Flag}
              label="Solventada"
              value={solventada ? formatFechaHoraGv(falla.solventado_at) : "Aún no solventada"}
            />
          </div>
        </section>

        <section>
          <GvDetalleSeccionTitulo>Evidencia fotográfica</GvDetalleSeccionTitulo>
          <GvDetalleTarjetaAnidada>
            <EvidenciasFallaEmbedded paths={falla.evidencia_url} />
          </GvDetalleTarjetaAnidada>
        </section>
      </div>
    </div>
  );
}

export function FallaDetalleView({
  falla,
  mecanicos,
  isAuthorized,
  embedded = false,
  onBack,
  onClose,
}: {
  falla: FallaRow;
  mecanicos: MecanicoOption[];
  isAuthorized: boolean;
  embedded?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}) {
  const [accion, setAccion] = useState<"atender" | "solventar" | null>(null);

  return (
    <div className={embedded ? undefined : "pb-8 pt-1"}>
      {!embedded && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 w-fit cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-0 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:opacity-80 dark:text-zinc-400"
        >
          <GvMorphIcon icon={ArrowLeft} hoverIcon={ChevronLeft} size={16} className="text-current" />
          Regresar
        </button>
      ) : null}

      <div className={cn(!embedded && "mt-4")}>
        <ContenidoFalla
          falla={falla}
          isAuthorized={isAuthorized}
          embedded={embedded}
          onClose={onClose}
          onAtender={() => setAccion("atender")}
          onSolventar={() => setAccion("solventar")}
        />
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
