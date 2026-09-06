"use client";

import { ArrowLeft, ChevronLeft } from "lucide";
import { MapPin } from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import { cn } from "@/lib/utils";
import { GV_DETALLE_CARD_CLASS } from "../lib/detalle-ui";
import {
  GvDetalleCerrar,
  GvDetalleComentarioLista,
  GvDetalleEncabezadoVehiculo,
  GvDetalleFilaVehiculo,
  GvDetalleSeccionTitulo,
  GvDetalleStat,
  GvDetalleTarjetaAnidada,
} from "../lib/gv-detalle-modal-ui";
import { GV_DETALLE_TEXTO_CLASS } from "../lib/detalle-ui";
import { type BitacoraRow } from "./lib/zod";

function formatMontoCombustible(monto: number) {
  if (monto <= 0) return "Sin recarga";
  return `Q. ${monto.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ContenidoBitacora({
  bitacora,
  embedded,
  onClose,
}: {
  bitacora: BitacoraRow;
  embedded: boolean;
  onClose?: () => void;
}) {
  const conductor = bitacora.profiles?.nombre?.trim() || "Desconocido";
  const placa = bitacora.ter_vehiculos?.placa ?? "—";
  const marca = bitacora.ter_vehiculos?.marca;
  const modelo = bitacora.ter_vehiculos?.modelo;
  const comentarios = bitacora.comentarios ?? [];
  const sinRecarga = Number(bitacora.monto_combustible) <= 0;

  if (embedded) {
    return (
      <div className="min-w-0 max-w-full space-y-5 pb-2">
        <div className="relative min-w-0 space-y-1 pr-12">
          {onClose ? <GvDetalleCerrar onClose={onClose} /> : null}
          <div className="flex min-w-0 items-start gap-2.5">
            <MapPin className="mt-1 size-6 shrink-0 text-celeste-trifinio" strokeWidth={2.25} />
            <div className="min-w-0 flex-1">
              <h1
                className={cn(
                  "text-2xl font-black capitalize tracking-tight text-foreground md:text-[1.65rem]",
                  GV_DETALLE_TEXTO_CLASS,
                )}
              >
                {bitacora.destino}
              </h1>
              <p className={cn("mt-1.5 text-sm text-muted-foreground", GV_DETALLE_TEXTO_CLASS)}>
                Conductor {conductor} · Registrado el {formatFechaHoraGv(bitacora.fecha)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
          <GvDetalleStat label="Km inicial" value={bitacora.km_inicial.toLocaleString("es-GT")} />
          <GvDetalleStat label="Km final" value={bitacora.km_final.toLocaleString("es-GT")} />
          <GvDetalleStat
            label="Recorrido"
            value={`${bitacora.km_recorrido.toLocaleString("es-GT")} km`}
            valueClassName="text-celeste-trifinio dark:text-[#6f9fd4]"
          />
        </div>

        <div className="flex min-w-0 max-w-full flex-col gap-8 border-t border-zinc-200 pt-6 dark:border-zinc-700/80">
          <section className="min-w-0 max-w-full">
            <GvDetalleSeccionTitulo>Vehículo y combustible</GvDetalleSeccionTitulo>
            <GvDetalleTarjetaAnidada>
              <GvDetalleEncabezadoVehiculo marca={marca} modelo={modelo} placa={placa} />
              <div className="mt-3">
                <GvDetalleFilaVehiculo
                  label="Combustible"
                  value={formatMontoCombustible(Number(bitacora.monto_combustible))}
                  valueClassName={sinRecarga ? "text-red-600 dark:text-red-400" : undefined}
                />
                {bitacora.vale_combustible?.trim() ? (
                  <GvDetalleFilaVehiculo label="Vale" value={bitacora.vale_combustible.trim()} />
                ) : null}
              </div>
            </GvDetalleTarjetaAnidada>
          </section>

          <section className="min-w-0 max-w-full">
            <GvDetalleSeccionTitulo>Comentarios</GvDetalleSeccionTitulo>
            <GvDetalleComentarioLista comentarios={comentarios} />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={GV_DETALLE_CARD_CLASS}>
      <div className="min-w-0">
        <h1 className="flex items-start gap-2.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
          <span className="mt-1 shrink-0 text-celeste-trifinio">
            <MapPin size={28} strokeWidth={2.25} />
          </span>
          <span className="min-w-0 capitalize">{bitacora.destino}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Conductor <span className="font-semibold text-celeste-trifinio">{conductor}</span>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <GvDetalleStat label="Km inicial" value={bitacora.km_inicial.toLocaleString("es-GT")} />
        <GvDetalleStat label="Km final" value={bitacora.km_final.toLocaleString("es-GT")} />
        <GvDetalleStat
          label="Recorrido"
          value={`${bitacora.km_recorrido.toLocaleString("es-GT")} km`}
          valueClassName="text-celeste-trifinio"
        />
      </div>

      <div className="mt-8 grid min-w-0 gap-8 border-t border-border pt-8 lg:grid-cols-[minmax(16rem,0.9fr)_minmax(0,1.65fr)] lg:gap-12 dark:border-zinc-700">
        <section className="min-w-0 max-w-full">
          <GvDetalleSeccionTitulo>Vehículo y combustible</GvDetalleSeccionTitulo>
          <GvDetalleTarjetaAnidada>
            <GvDetalleEncabezadoVehiculo marca={marca} modelo={modelo} placa={placa} />
            <div className="mt-4">
              <GvDetalleFilaVehiculo
                label="Combustible"
                value={formatMontoCombustible(Number(bitacora.monto_combustible))}
              />
              <GvDetalleFilaVehiculo label="Vale" value={bitacora.vale_combustible?.trim() || "—"} />
            </div>
          </GvDetalleTarjetaAnidada>
        </section>

        <section className="min-w-0 max-w-full">
          <GvDetalleSeccionTitulo>Comentarios</GvDetalleSeccionTitulo>
          <GvDetalleComentarioLista comentarios={comentarios} vacioClassName="mt-4" />
        </section>
      </div>
    </div>
  );
}

export function BitacoraDetalleView({
  bitacora,
  embedded = false,
  onBack,
  onClose,
}: {
  bitacora: BitacoraRow;
  embedded?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}) {
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
        <ContenidoBitacora bitacora={bitacora} embedded={embedded} onClose={onClose} />
      </div>
    </div>
  );
}
