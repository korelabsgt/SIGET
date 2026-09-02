"use client";

import {
  ArrowLeft,
  Car,
  CarFront,
  ChevronLeft,
  MapPin,
  MessageSquare,
  Route,
} from "lucide";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaHoraGt } from "@/lib/fechas-gt";
import { cn } from "@/lib/utils";
import {
  GV_DETALLE_CARD_CLASS,
  GV_DETALLE_CHIP_CLASS,
  GV_DETALLE_NESTED_CLASS,
} from "../lib/detalle-ui";
import { type BitacoraRow } from "./lib/zod";

function ChipDato({
  icon,
  hoverIcon,
  label,
  value,
}: {
  icon: typeof MapPin;
  hoverIcon: typeof MapPin;
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
  icon: typeof MapPin;
  hoverIcon: typeof MapPin;
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

function FilaSimple({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-zinc-300 py-3 first:border-t-0 first:pt-0 dark:border-zinc-800">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-right text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatMontoCombustible(monto: number) {
  if (monto <= 0) return "Sin recarga";
  return `Q. ${monto.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function BitacoraDetalleView({
  bitacora,
  onBack,
}: {
  bitacora: BitacoraRow;
  onBack: () => void;
}) {
  const conductor = bitacora.profiles?.nombre?.trim() || "Desconocido";
  const placa = bitacora.ter_vehiculos?.placa ?? "—";
  const vehiculoLabel = bitacora.ter_vehiculos
    ? `${bitacora.ter_vehiculos.marca} ${bitacora.ter_vehiculos.modelo}`
    : "Sin datos";
  const comentarios = bitacora.comentarios ?? [];

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
        <div className="min-w-0">
          <h1 className="flex items-start gap-2.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            <span className="mt-1 shrink-0 text-celeste-trifinio">
              <GvMorphIcon icon={MapPin} size={28} morphOnHover={false} />
            </span>
            <span className="min-w-0 capitalize">{bitacora.destino}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Conductor{" "}
            <span className="font-semibold text-celeste-trifinio">{conductor}</span>
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <ChipDato
            icon={Route}
            hoverIcon={MapPin}
            label="Fecha del viaje"
            value={formatFechaHoraGt(bitacora.fecha)}
          />
          <ChipDato
            icon={Route}
            hoverIcon={Route}
            label="Km inicial"
            value={`${bitacora.km_inicial.toLocaleString("es-GT")} km`}
          />
          <ChipDato
            icon={Route}
            hoverIcon={Route}
            label="Km final"
            value={`${bitacora.km_final.toLocaleString("es-GT")} km`}
          />
          <ChipDato
            icon={Route}
            hoverIcon={MapPin}
            label="Total recorrido"
            value={`${bitacora.km_recorrido.toLocaleString("es-GT")} km`}
          />
        </div>

        <div className="mt-8 grid gap-8 border-t border-border pt-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.9fr)] lg:gap-12 dark:border-zinc-700">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
              Comentarios
            </h2>
            {comentarios.length > 0 ? (
              <div className="mt-6">
                {comentarios.map((c) => (
                  <FilaDocumento
                    key={c.id}
                    icon={MessageSquare}
                    hoverIcon={MessageSquare}
                    label={formatFechaHoraGt(c.fecha)}
                    value={c.texto}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Sin comentarios registrados.</p>
            )}
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
              Vehículo y combustible
            </h2>
            <div className={cn("mt-4", GV_DETALLE_NESTED_CLASS)} data-morph-hover-scope>
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-celeste-trifinio text-white">
                  <GvMorphIcon icon={Car} hoverIcon={CarFront} size={22} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black uppercase tracking-wide text-foreground">
                    {placa}
                  </p>
                  <p className="truncate text-sm capitalize text-muted-foreground">{vehiculoLabel}</p>
                </div>
              </div>
              <div className="mt-4">
                <FilaSimple
                  label="Monto combustible"
                  value={formatMontoCombustible(Number(bitacora.monto_combustible))}
                />
                <FilaSimple label="Vale" value={bitacora.vale_combustible?.trim() || "—"} />
                <FilaSimple
                  label="Misión vinculada"
                  value={bitacora.solicitud_id ? "Sí" : "Registro manual"}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
