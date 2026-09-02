"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Car,
  CarFront,
  Check,
  ChevronLeft,
  Cog,
  EllipsisVertical,
  File,
  FileText,
  Gauge,
  MoreVertical,
  Palette,
  PenSquare,
  Pencil,
  Plus,
  Shield,
  ShieldCheck,
  Trash,
  Trash2,
  Wrench,
} from "lucide";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { confirmDestructivo } from "@/lib/confirm-destructivo";
import { formatFechaHoraGt } from "@/lib/fechas-gt";
import { GvMorphIcon } from "../lib/morph-icon";
import {
  GV_DETALLE_CARD_CLASS,
  GV_DETALLE_CHIP_CLASS,
  GV_DETALLE_NESTED_CLASS,
} from "../lib/detalle-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canDeleteVehiculoFotos, canManageFlota } from "../lib/permissions";
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
  return "text-celeste-trifinio dark:text-celeste-trifinio";
}

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
    <div className={GV_DETALLE_CHIP_CLASS} data-morph-hover-scope>
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
  badge,
  badgeClass,
}: {
  icon: typeof Car;
  hoverIcon: typeof Car;
  label: string;
  value: string;
  badge?: string;
  badgeClass?: string;
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
      {badge ? (
        <span className={cn("shrink-0 text-[10px] font-bold uppercase tracking-wider", badgeClass)}>
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function VehiculoGaleria({
  vehiculo,
  onEdit,
  canManage,
}: {
  vehiculo: VehiculoRow;
  onEdit: (vehiculo: VehiculoRow) => void;
  canManage: boolean;
}) {
  const { effectiveRole } = useUserContext();
  const canDeleteFoto = canDeleteVehiculoFotos(effectiveRole);
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
    if (!canDeleteFoto) return;
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
    <div className={cn("mt-4", GV_DETALLE_NESTED_CLASS)} data-morph-hover-scope>
      {fotosConSrc.length > 0 || canManage ? (
        <div className="mb-3 flex flex-wrap gap-2">
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
                  "relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border-0 p-0",
                  activa ? "ring-2 ring-celeste-trifinio" : "opacity-55 hover:opacity-100",
                )}
                aria-label={`Ver fotografía ${index + 1}`}
                aria-pressed={activa}
              >
                <img src={item.src} alt="" className="size-full object-cover" />
              </button>
            );
          })}
          {canManage ? (
            <button
              type="button"
              onClick={() => onEdit(vehiculo)}
              className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border/40 bg-sky-50/60 text-celeste-trifinio hover:bg-sky-100 dark:border-zinc-700 dark:bg-sky-950/20 dark:hover:bg-sky-950/40"
              aria-label="Agregar fotografías"
            >
              <GvMorphIcon icon={Plus} size={20} morphOnHover={false} />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-sky-50/60 dark:bg-sky-950/20">
        {firmandoFotos && fotos.length > 0 ? (
          <div className="flex size-full items-center justify-center text-celeste-trifinio">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : mostrarFoto ? (
          <>
            <img
              src={fotoActiva?.src ?? ""}
              alt={tituloVehiculo}
              onError={() => setFotoRota(true)}
              className="size-full object-cover object-center"
            />
            {canDeleteFoto ? (
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
            ) : null}
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-celeste-trifinio">
            <GvMorphIcon icon={Car} hoverIcon={CarFront} size={40} />
            <p className="text-sm font-medium text-muted-foreground">Sin fotografía</p>
            {canManage ? (
              <button
                type="button"
                onClick={() => onEdit(vehiculo)}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border-0 bg-celeste-trifinio px-4 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
              >
                Agregar foto
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function VehiculoDetalleView({
  vehiculo,
  onBack,
  onEdit,
  onDelete,
  canManage,
}: {
  vehiculo: VehiculoRow;
  onBack: () => void;
  onEdit: (vehiculo: VehiculoRow) => void;
  onDelete: (vehiculo: VehiculoRow) => void;
  canManage: boolean;
}) {
  const { effectiveRole } = useUserContext();
  const canShowActionsMenu = canManageFlota(effectiveRole);
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

  const acciones = canShowActionsMenu ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 text-celeste-trifinio transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
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
          onSelect={() => void onDelete(vehiculo)}
        >
          <GvMorphIcon icon={Trash2} hoverIcon={Trash} size={14} className="text-current" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

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

      <div className={cn("relative mt-4", GV_DETALLE_CARD_CLASS)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  estadoBadgeClass(vehiculo.estado),
                )}
              >
                {estadoLabel(vehiculo.estado)}
              </span>
              {vehiculo.created_at ? (
                <span className="text-xs text-muted-foreground">
                  Registrado el {formatFechaHoraGt(vehiculo.created_at)}
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 flex items-start gap-2.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
              <span className="mt-1 shrink-0 text-celeste-trifinio">
                <GvMorphIcon icon={Car} hoverIcon={CarFront} size={28} morphOnHover={false} />
              </span>
              <span className="min-w-0 uppercase">{vehiculo.placa}</span>
            </h1>
            <p className="mt-2 text-sm capitalize text-muted-foreground">
              {vehiculo.marca} {vehiculo.modelo}
            </p>
          </div>
          {acciones ? <div className="shrink-0">{acciones}</div> : null}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <ChipDato
            icon={Gauge}
            hoverIcon={Wrench}
            label="Kilometraje"
            value={`${vehiculo.kilometraje_actual.toLocaleString("es-GT")} km`}
          />
          <ChipDato
            icon={Car}
            hoverIcon={CarFront}
            label="Año"
            value={vehiculo.anio ? String(vehiculo.anio) : "N/A"}
          />
          <ChipDato icon={Palette} hoverIcon={Check} label="Color" value={vehiculo.color} />
        </div>

        <div className="mt-8 grid gap-8 border-t border-border pt-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.9fr)] lg:gap-12 dark:border-zinc-700">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
              Documentación y mantenimiento
            </h2>
            <div className="mt-4">
              <FilaDocumento
                icon={FileText}
                hoverIcon={File}
                label="Circulación"
                value={fechaCirculacion}
                badge={circulacion.etiqueta}
                badgeClass={alertTextClass(circulacion.estado)}
              />
              <FilaDocumento
                icon={Shield}
                hoverIcon={ShieldCheck}
                label="Seguro"
                value={fechaSeguro}
                badge={seguro.etiqueta}
                badgeClass={alertTextClass(seguro.estado)}
              />
              <FilaDocumento
                icon={Wrench}
                hoverIcon={Cog}
                label="Estado de servicio"
                value={
                  mantenimiento.kmFaltantes <= 0
                    ? "Servicio vencido"
                    : `${mantenimiento.kmFaltantes.toLocaleString("es-GT")} km restantes`
                }
                badge={servicioEtiqueta}
                badgeClass={alertTextClass(mantenimiento.estado)}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
              Fotografías
            </h2>
            <VehiculoGaleria vehiculo={vehiculo} onEdit={onEdit} canManage={canManage} />
          </section>
        </div>
      </div>
    </div>
  );
}
