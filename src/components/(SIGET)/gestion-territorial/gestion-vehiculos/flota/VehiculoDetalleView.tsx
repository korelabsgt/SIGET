"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Car,
  CarFront,
  Camera,
  Gauge,
  Calendar,
  Palette,
  FileText,
  Shield,
  Wrench,
  PenSquare,
  Trash2,
  Hash,
} from "lucide-react";
import { type VehiculoRow } from "./lib/zod";
import {
  getAlertStatusClasses,
  getMantenimientoAlertStatus,
  getVencimientoDocumentoStatus,
} from "./lib/helpers";
import { cn } from "@/lib/utils";

function DocCard({
  icon: Icon,
  titulo,
  fecha,
  detalle,
  className,
}: {
  icon: typeof FileText;
  titulo: string;
  fecha: string | null | undefined;
  detalle?: string;
  className?: string;
}) {
  const status = getVencimientoDocumentoStatus(fecha);
  const fechaTexto = fecha
    ? format(new Date(fecha), "dd MMM yyyy", { locale: es })
    : "Sin registrar";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border border-border bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-celeste-trifinio dark:bg-sky-950/60">
            <Icon className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {titulo}
            </p>
            <p className="text-sm font-semibold text-foreground">{fechaTexto}</p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            getAlertStatusClasses(status.estado),
          )}
        >
          {status.etiqueta}
        </span>
      </div>
      {detalle ? (
        <p className="mt-auto pt-3 text-xs text-muted-foreground">{detalle}</p>
      ) : status.diasRestantes !== null && status.diasRestantes > 0 ? (
        <p className="mt-auto pt-3 text-xs text-muted-foreground">
          Vence en {status.diasRestantes} día{status.diasRestantes === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

function SpecItem({
  icon: Icon,
  label,
  value,
  large,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-200/80 text-muted-foreground dark:bg-zinc-700">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "font-semibold text-foreground",
            large ? "mt-0.5 text-2xl uppercase tracking-wider md:text-3xl" : "mt-1 text-lg",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function VehiculoFotoHero({
  vehiculo,
  onEdit,
}: {
  vehiculo: VehiculoRow;
  onEdit: (vehiculo: VehiculoRow) => void;
}) {
  const tituloVehiculo = `${vehiculo.marca} ${vehiculo.modelo}`;

  if (vehiculo.imagen_url) {
    return (
      <div className="group relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-border bg-zinc-900 dark:border-zinc-700">
        <img
          src={vehiculo.imagen_url}
          alt={tituloVehiculo}
          className="absolute inset-0 size-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-md">
            <Camera className="size-3" />
            Fotografía oficial
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-zinc-100 via-sky-50/90 to-zinc-200 dark:border-zinc-700 dark:from-zinc-800 dark:via-sky-950/25 dark:to-zinc-900">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,rgb(161_161_170_/_0.28)_1px,transparent_0)] [background-size:22px_22px] dark:[background-image:radial-gradient(circle_at_1px_1px,rgb(113_113_122_/_0.35)_1px,transparent_0)]" />
      <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-celeste-trifinio/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-800/20" />

      <div className="relative flex h-full min-h-[280px] flex-col items-center justify-center gap-5 px-6 py-10">
        <div className="relative">
          <div className="absolute inset-0 scale-125 rounded-full bg-celeste-trifinio/20 blur-2xl" />
          <div className="relative flex size-28 items-center justify-center rounded-[1.75rem] border border-white/70 bg-white/75 shadow-sm backdrop-blur-sm dark:border-zinc-600 dark:bg-zinc-800/90">
            <CarFront className="size-14 text-celeste-trifinio" strokeWidth={1.25} />
          </div>
        </div>

        <div className="max-w-sm text-center">
          <p className="text-base font-semibold text-foreground">Sin fotografía registrada</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Complete la ficha visual del vehículo subiendo una imagen en formato JPG, PNG o WEBP.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onEdit(vehiculo)}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-celeste-trifinio px-5 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
        >
          <Camera className="size-4" />
          Agregar fotografía
        </button>
      </div>
    </div>
  );
}

export function VehiculoDetalleView({
  vehiculo,
  onBack,
  onEdit,
  onDelete,
}: {
  vehiculo: VehiculoRow;
  onBack: () => void;
  onEdit: (vehiculo: VehiculoRow) => void;
  onDelete: (vehiculo: VehiculoRow) => void;
}) {
  const mantenimiento = getMantenimientoAlertStatus(vehiculo.kilometraje_actual);
  const kmDesdeUltimo = vehiculo.kilometraje_actual % 5000;
  const progresoServicio = Math.min(100, Math.round((kmDesdeUltimo / 5000) * 100));

  return (
    <div className="px-3 pb-6 pt-4 sm:px-5 sm:pt-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-zinc-200 px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Volver a la lista
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(vehiculo)}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-sky-100 px-4 text-[10px] font-bold uppercase tracking-wider text-azul-trifinio transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900"
          >
            <PenSquare className="size-4" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDelete(vehiculo)}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-red-100 px-4 text-[10px] font-bold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
          >
            <Trash2 className="size-4" />
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        <div className="flex h-full lg:col-span-5">
          <div className="h-full w-full">
            <VehiculoFotoHero vehiculo={vehiculo} onEdit={onEdit} />
          </div>
        </div>

        <div className="flex h-full rounded-2xl border border-border bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800 lg:col-span-7">
          <div className="w-full">
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-celeste-trifinio">
            Especificaciones y estado operativo
          </p>
          <div className="mb-6 border-b border-border pb-5 dark:border-zinc-700">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Marca / modelo
            </p>
            <p className="mt-1 text-2xl font-black capitalize tracking-tight text-foreground md:text-3xl">
              {vehiculo.marca} {vehiculo.modelo}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SpecItem icon={Hash} label="Placa" value={vehiculo.placa} large />
            <SpecItem
              icon={Gauge}
              label="Odómetro"
              value={`${vehiculo.kilometraje_actual.toLocaleString()} km`}
            />
            <SpecItem
              icon={Calendar}
              label="Año"
              value={vehiculo.anio ? String(vehiculo.anio) : "N/A"}
            />
            <SpecItem icon={Palette} label="Color" value={vehiculo.color} />
            <div className="flex items-start gap-4 sm:col-span-2">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-200/80 text-muted-foreground dark:bg-zinc-700">
                <Car className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Estado operativo
                </p>
                <div className="mt-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                      vehiculo.estado === "LIBRE"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : vehiculo.estado === "RESERVADO"
                          ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                    )}
                  >
                    {vehiculo.estado.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <div className="flex h-full lg:col-span-6">
          <div className="grid h-full w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <DocCard
              icon={FileText}
              titulo="Tarjeta de circulación"
              fecha={vehiculo.vencimiento_circulacion}
            />
            <DocCard
              icon={Shield}
              titulo="Póliza de seguro"
              fecha={vehiculo.vencimiento_seguro}
              detalle="Cobertura y aseguradora no registradas en el sistema."
            />
          </div>
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-border bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800 lg:col-span-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <Wrench className="size-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio">
                  Mantenimiento preventivo
                </p>
                <p className="text-sm font-semibold text-foreground">
                  Próximo servicio a los {mantenimiento.siguienteServicio.toLocaleString()} km
                </p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                getAlertStatusClasses(mantenimiento.estado),
              )}
            >
              {mantenimiento.kmFaltantes <= 0
                ? "Vencido"
                : mantenimiento.kmFaltantes <= 500
                  ? "Próximo"
                  : "Al día"}
            </span>
          </div>

          <div className="mt-auto space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ciclo cada 5,000 km</span>
              <span className="font-semibold text-foreground">
                {mantenimiento.kmFaltantes <= 0
                  ? "Servicio vencido"
                  : `${mantenimiento.kmFaltantes.toLocaleString()} km restantes`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  mantenimiento.estado === "ROJO"
                    ? "bg-red-500"
                    : mantenimiento.estado === "AMARILLO"
                      ? "bg-amber-500"
                      : "bg-emerald-500",
                )}
                style={{ width: `${progresoServicio}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
