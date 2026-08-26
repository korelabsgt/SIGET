"use client";

import { useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Car,
  CarFront,
  ChevronLeft,
  Cog,
  EllipsisVertical,
  File,
  FileText,
  Loader2,
  MoreVertical,
  PenSquare,
  Pencil,
  Plus,
  Shield,
  ShieldCheck,
  Trash,
  Trash2,
  Wrench,
} from "lucide";
import type { IconNode } from "lucide";
import { toast } from "react-toastify";
import { confirmDestructivo } from "@/lib/confirm-destructivo";
import { GvMorphIcon } from "../lib/morph-icon";
import {
  GV_DETALLE_NESTED_CLASS,
  GV_DETALLE_PANEL_CLASS,
} from "../lib/detalle-ui";
import { type AlertStatus, type VehiculoRow } from "./lib/zod";
import {
  fotosVehiculo,
  getMantenimientoAlertStatus,
  getVencimientoDocumentoStatus,
  MIN_FOTOS_VEHICULO,
} from "./lib/helpers";
import { useQuitarImagenVehiculo } from "./lib/hooks";
import {
  resolveStorageDisplaySrc,
  useSignedStorageUrls,
} from "../lib/storage-hooks";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function estadoBadgeClass(estado: VehiculoRow["estado"]) {
  if (estado === "LIBRE") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
  }
  if (estado === "RESERVADO") {
    return "bg-sky-100 text-celeste-trifinio dark:bg-sky-950";
  }
  return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
}

function estadoLabel(estado: VehiculoRow["estado"]) {
  return estado.replace(/_/g, " ");
}

function alertTextClass(estado: AlertStatus) {
  if (estado === "VERDE") {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (estado === "AMARILLO") {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-red-500 dark:text-red-400";
}

function VehiculoFotoHero({
  vehiculo,
  onEdit,
}: {
  vehiculo: VehiculoRow;
  onEdit: (vehiculo: VehiculoRow) => void;
}) {
  const tituloVehiculo = `${vehiculo.marca} ${vehiculo.modelo}`;
  const fotos = fotosVehiculo(vehiculo);
  const { data: signedMap = {}, isLoading: firmandoFotos } = useSignedStorageUrls(fotos);
  const fotosConSrc = fotos
    .map((path) => ({
      path,
      src: resolveStorageDisplaySrc(path, signedMap),
    }))
    .filter((item) => item.src.length > 0);
  const [fotoRota, setFotoRota] = useState(false);
  const [indice, setIndice] = useState(0);
  const fotoActiva = fotosConSrc[indice] ?? fotosConSrc[0] ?? null;
  const mostrarFoto = Boolean(fotoActiva) && !fotoRota && !firmandoFotos;
  const quitarImagen = useQuitarImagenVehiculo();

  useEffect(() => {
    setFotoRota(false);
    setIndice(0);
  }, [vehiculo.id, fotos.join("|")]);

  useEffect(() => {
    if (indice >= fotosConSrc.length) setIndice(0);
  }, [fotosConSrc.length, indice]);

  const handleQuitarFoto = async (path: string) => {
    if (!vehiculo.id) return;
    if (fotos.length <= MIN_FOTOS_VEHICULO) {
      toast.warn("Debes conservar al menos una fotografía del vehículo.");
      return;
    }
    const res = await confirmDestructivo({
      title: "¿Eliminar fotografía?",
      text: "Se quitará de la galería y del almacenamiento.",
      confirmButtonText: "Sí, eliminar",
    });
    if (!res.isConfirmed) return;
    try {
      await quitarImagen.mutateAsync({ id: vehiculo.id, path });
      toast.success("Fotografía eliminada.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar la fotografía.",
      );
    }
  };

  return (
    <div className="flex h-auto min-h-0 min-w-0 w-full flex-col gap-2 lg:h-full sm:flex-row">
      <div
        className={cn(
          "relative h-[min(52vh,26rem)] min-h-64 w-full min-w-0 overflow-hidden lg:h-full lg:min-h-0 lg:flex-1",
          GV_DETALLE_PANEL_CLASS,
        )}
      >
        {firmandoFotos && fotos.length > 0 ? (
          <div className="flex size-full items-center justify-center text-celeste-trifinio">
            <span className="inline-flex animate-spin">
              <GvMorphIcon icon={Loader2} size={32} morphOnHover={false} />
            </span>
          </div>
        ) : mostrarFoto ? (
          <>
            <img
              src={fotoActiva?.src ?? ""}
              alt={tituloVehiculo}
              onError={() => setFotoRota(true)}
              className="size-full object-cover object-center"
            />
            <button
              type="button"
              disabled={quitarImagen.isPending}
              onClick={() => {
                if (fotoActiva?.path) void handleQuitarFoto(fotoActiva.path);
              }}
              className="absolute left-2 top-2 z-10 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-red-100 text-red-600 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
              aria-label="Eliminar fotografía"
            >
              <GvMorphIcon icon={Trash2} hoverIcon={Trash} size={16} />
            </button>
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-celeste-trifinio">
            <GvMorphIcon icon={Car} hoverIcon={CarFront} size={48} />
            <p className="text-sm font-medium text-muted-foreground">Sin fotografía</p>
            <button
              type="button"
              onClick={() => onEdit(vehiculo)}
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border-0 bg-celeste-trifinio px-4 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            >
              Agregar foto
            </button>
          </div>
        )}
      </div>

      <div className="flex h-12 w-fit max-w-full shrink-0 flex-row gap-1 overflow-x-auto rounded-2xl border border-border/40 bg-sky-50/60 p-1 dark:border-zinc-700 dark:bg-sky-950/20 lg:h-fit lg:w-12 lg:flex-col lg:self-start lg:overflow-hidden">
        {fotosConSrc.map((item, index) => {
          const activa = index === indice && !fotoRota && mostrarFoto;
          return (
            <button
              key={`${item.path}-${index}`}
              type="button"
              onClick={() => {
                setFotoRota(false);
                setIndice(index);
              }}
              className={cn(
                "relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-md border-0 p-0 sm:aspect-square sm:h-auto sm:w-full",
                activa ? "ring-2 ring-celeste-trifinio" : "opacity-55 hover:opacity-100",
              )}
              aria-label={`Ver fotografía ${index + 1}`}
              aria-pressed={activa}
            >
              <img src={item.src} alt="" className="size-full object-cover" />
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onEdit(vehiculo)}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border/40 bg-sky-50/60 text-celeste-trifinio hover:bg-sky-100 dark:border-zinc-700 dark:bg-sky-950/20 dark:hover:bg-sky-950/40 sm:aspect-square sm:h-auto sm:w-full"
          aria-label="Agregar fotografías"
        >
          <GvMorphIcon icon={Plus} size={20} morphOnHover={false} />
        </button>
      </div>
    </div>
  );
}

function SpecStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className={cn("min-w-0", GV_DETALLE_NESTED_CLASS, "px-2 py-2 sm:px-3 sm:py-2.5")}>
      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-celeste-trifinio sm:text-[9px] sm:tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-black tabular-nums leading-none text-foreground sm:mt-1 sm:text-sm">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 hidden truncate text-[10px] leading-tight text-muted-foreground sm:mt-1 sm:block">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function CelesteChip({
  children,
  size = "md",
}: {
  children: ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-celeste-trifinio text-white",
        size === "lg" ? "size-10 sm:size-12" : "size-8 sm:size-11",
      )}
    >
      {children}
    </div>
  );
}

function EstadoDoc({
  icon,
  hoverIcon,
  titulo,
  valor,
  badge,
  badgeClass,
  extra,
}: {
  icon: IconNode;
  hoverIcon: IconNode;
  titulo: string;
  valor: string;
  badge: string;
  badgeClass: string;
  extra?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2 sm:gap-3", GV_DETALLE_NESTED_CLASS, "px-2 py-2 sm:px-3 sm:py-3")}>
      <CelesteChip>
        <GvMorphIcon icon={icon} hoverIcon={hoverIcon} size={16} />
      </CelesteChip>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px] sm:tracking-[0.16em]">
          {titulo}
        </p>
        <p className="truncate text-xs font-black tabular-nums leading-tight text-foreground sm:text-sm">
          {valor}
        </p>
        {extra ? (
          <p className="truncate text-[9px] leading-tight text-muted-foreground sm:text-[10px]">{extra}</p>
        ) : null}
      </div>
      <span
        className={cn(
          "max-w-[4.75rem] shrink-0 text-right text-[8px] font-bold uppercase leading-tight tracking-widest sm:max-w-none sm:text-[10px] sm:leading-none",
          badgeClass,
        )}
      >
        {badge}
      </span>
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
  const circulacion = getVencimientoDocumentoStatus(vehiculo.vencimiento_circulacion);
  const seguro = getVencimientoDocumentoStatus(vehiculo.vencimiento_seguro);

  const fechaCirculacion = vehiculo.vencimiento_circulacion
    ? format(new Date(vehiculo.vencimiento_circulacion), "dd MMM yyyy", { locale: es })
    : "Sin registrar";
  const fechaSeguro = vehiculo.vencimiento_seguro
    ? format(new Date(vehiculo.vencimiento_seguro), "dd MMM yyyy", { locale: es })
    : "Sin registrar";

  const servicioEtiqueta =
    mantenimiento.kmFaltantes <= 0
      ? "Vencido"
      : mantenimiento.kmFaltantes <= 500
        ? "Próximo"
        : "Al día";

  return (
    <div className="flex h-auto min-h-full flex-col gap-3 overflow-visible px-0 pb-4 pt-6 lg:h-full lg:min-h-0 lg:gap-2 lg:overflow-hidden lg:pb-0 lg:pt-0">
      <button
        type="button"
        onClick={onBack}
        className="mt-1 inline-flex h-10 w-fit shrink-0 cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-1 text-xs font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-100"
      >
        <GvMorphIcon icon={ArrowLeft} hoverIcon={ChevronLeft} size={16} className="text-current" />
        Regresar
      </button>

      <div className="grid h-auto gap-3 lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-2 lg:overflow-hidden">
        <VehiculoFotoHero vehiculo={vehiculo} onEdit={onEdit} />

        <div
          className={cn(
            "relative flex h-auto w-full min-w-0 flex-col overflow-hidden lg:h-full lg:min-h-0",
            GV_DETALLE_PANEL_CLASS,
          )}
        >
          <div className="flex h-full min-h-0 flex-col justify-start gap-3 p-4 pt-3 sm:gap-4 sm:p-5 sm:pt-4 lg:gap-5 lg:p-6 lg:pt-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-celeste-trifinio">
              Identificación
            </p>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex max-w-[9rem] shrink-0 truncate rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider sm:max-w-none sm:px-2.5 sm:text-[10px]",
                  estadoBadgeClass(vehiculo.estado),
                )}
              >
                {estadoLabel(vehiculo.estado)}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-celeste-trifinio transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    aria-label={`Más acciones de ${vehiculo.placa}`}
                  >
                    <GvMorphIcon
                      icon={EllipsisVertical}
                      hoverIcon={MoreVertical}
                      size={18}
                      className="text-current"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-[200] min-w-[10rem] rounded-xl border border-border bg-white p-1 text-foreground opacity-100 shadow-lg dark:bg-zinc-900"
                >
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 bg-white text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800"
                    onSelect={() => onEdit(vehiculo)}
                  >
                    <GvMorphIcon icon={PenSquare} hoverIcon={Pencil} size={14} className="text-current" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 bg-white text-red-600 focus:bg-red-50 focus:text-red-600 dark:bg-zinc-900 dark:text-red-400 dark:focus:bg-red-950/60"
                    onSelect={() => onDelete(vehiculo)}
                  >
                    <GvMorphIcon icon={Trash2} hoverIcon={Trash} size={14} className="text-current" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-5">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <CelesteChip size="lg">
                <GvMorphIcon icon={Car} hoverIcon={CarFront} size={20} />
              </CelesteChip>
              <div className="min-w-0">
                <p className="truncate text-2xl font-black uppercase leading-none tracking-[0.08em] text-foreground sm:text-3xl sm:tracking-[0.12em] lg:text-4xl">
                  {vehiculo.placa}
                </p>
                <p className="mt-1 truncate text-xs font-medium capitalize leading-tight text-muted-foreground sm:mt-1.5 sm:text-sm">
                  {vehiculo.marca} {vehiculo.modelo}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <SpecStat
                label="Kilometraje"
                value={`${vehiculo.kilometraje_actual.toLocaleString("es-GT")} km`}
                hint={`Servicio ${mantenimiento.siguienteServicio.toLocaleString("es-GT")} km`}
              />
              <SpecStat
                label="Año"
                value={vehiculo.anio ? String(vehiculo.anio) : "N/A"}
              />
              <SpecStat label="Color" value={vehiculo.color} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:gap-2.5">
            <EstadoDoc
              icon={FileText}
              hoverIcon={File}
              titulo="Circulación"
              valor={fechaCirculacion}
              badge={circulacion.etiqueta}
              badgeClass={alertTextClass(circulacion.estado)}
            />
            <EstadoDoc
              icon={Shield}
              hoverIcon={ShieldCheck}
              titulo="Seguro"
              valor={fechaSeguro}
              badge={seguro.etiqueta}
              badgeClass={alertTextClass(seguro.estado)}
            />
            <EstadoDoc
              icon={Wrench}
              hoverIcon={Cog}
              titulo="Próximo servicio"
              valor={`${mantenimiento.siguienteServicio.toLocaleString("es-GT")} km`}
              badge={servicioEtiqueta}
              badgeClass={alertTextClass(mantenimiento.estado)}
              extra={
                mantenimiento.kmFaltantes <= 0
                  ? "Servicio vencido"
                  : `${mantenimiento.kmFaltantes.toLocaleString("es-GT")} km restantes`
              }
            />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
