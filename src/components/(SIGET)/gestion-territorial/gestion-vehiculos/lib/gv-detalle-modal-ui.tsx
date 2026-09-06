"use client";

import { type ReactNode } from "react";
import { Car, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GV_DETALLE_TEXTO_CLASS } from "./detalle-ui";
import { formatFechaHoraGv } from "./gv-fechas";

export { formatFechaHoraGv } from "./gv-fechas";

export function GvDetalleCerrar({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-0 top-0 flex size-10 cursor-pointer items-center justify-center rounded-full text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10"
      aria-label="Cerrar"
    >
      <X size={22} strokeWidth={2.25} />
    </button>
  );
}

export function GvDetalleStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-100 px-3 py-3 dark:bg-zinc-800/90">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("mt-1 break-words text-sm font-bold leading-snug text-foreground", valueClassName)}>{value}</p>
    </div>
  );
}

export function GvDetalleFilaVehiculo({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-zinc-200 py-3 first:border-t-0 first:pt-0 dark:border-zinc-700/80">
      <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("min-w-0 flex-1 text-right text-sm font-semibold text-foreground", GV_DETALLE_TEXTO_CLASS, valueClassName)}>
        {value}
      </p>
    </div>
  );
}

export function GvDetalleFilaIcono({
  icon: Icon,
  label,
  value,
  destacado = false,
  valorClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  destacado?: boolean;
  valorClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-t border-zinc-200 py-4 first:border-t-0 first:pt-0 dark:border-zinc-700/80">
      <span className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-500">
        <Icon size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 text-sm leading-relaxed",
            GV_DETALLE_TEXTO_CLASS,
            valorClassName,
            !valorClassName && (destacado ? "font-semibold text-foreground" : "text-muted-foreground"),
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function GvDetalleSeccionTitulo({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">{children}</h2>
  );
}

export function GvDetalleComentarioLista({
  comentarios,
  vacioClassName,
}: {
  comentarios: { id: string; texto: string; fecha: string }[];
  vacioClassName?: string;
}) {
  if (comentarios.length === 0) {
    return (
      <p className={cn("mt-4 text-sm text-muted-foreground", vacioClassName)}>
        Sin comentarios registrados.
      </p>
    );
  }

  return (
    <div className="mt-4 min-w-0 max-w-full space-y-0">
      {comentarios.map((comentario, index) => (
        <div
          key={comentario.id}
          className={cn(
            "min-w-0 max-w-full py-4",
            index > 0 && "border-t border-zinc-200 dark:border-zinc-700/80",
          )}
        >
          <p
            className={cn(
              "text-sm font-medium leading-relaxed text-foreground",
              GV_DETALLE_TEXTO_CLASS,
            )}
          >
            {comentario.texto}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {formatFechaHoraGv(comentario.fecha)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function GvDetalleEncabezadoVehiculo({
  marca,
  modelo,
  placa,
}: {
  marca?: string | null;
  modelo?: string | null;
  placa: string;
}) {
  const modeloLabel = [marca, modelo].filter(Boolean).join(" ").trim() || "Sin datos";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-celeste-trifinio text-white">
        <Car size={22} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-lg font-black capitalize tracking-tight text-foreground", GV_DETALLE_TEXTO_CLASS)}>
          {modeloLabel}
        </p>
        <p className={cn("text-sm font-bold uppercase tracking-wide text-muted-foreground", GV_DETALLE_TEXTO_CLASS)}>
          {placa}
        </p>
      </div>
    </div>
  );
}

export function GvDetalleTarjetaAnidada({ children }: { children: ReactNode }) {
  return <div className="min-w-0 overflow-hidden rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800/90">{children}</div>;
}
