"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  EllipsisVertical,
  LogIn,
  MoreVertical,
  PenSquare,
  Pencil,
  Trash,
  Trash2,
} from "lucide";
import { Activity, AlertTriangle, Car as CarIcon, Route } from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { type VehiculoRow } from "./lib/zod";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GV_LIST_CARD_CHIP_CLASS,
  GV_LIST_CARD_CLASS,
  GV_LIST_CARD_FOOTER_CLASS,
  GV_LIST_CARD_ICON_BOX_CLASS,
  GV_LIST_CARD_SECTION_CLASS,
} from "../lib/detalle-ui";

function estadoVehiculoBadgeClass(estado: string) {
  switch (estado) {
    case "LIBRE":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
    case "RESERVADO":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400";
    case "EN_MANTENIMIENTO":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

function formatEstadoVehiculo(estado: string) {
  return estado.replace("_", " ");
}

export function VehiculoCard({
  vehiculo,
  onDetail,
  onEdit,
  onDelete,
  canManage,
  index = 0,
}: {
  vehiculo: VehiculoRow;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
  index?: number;
}) {
  const checkVencimiento = (fecha: string | null | undefined) => {
    if (!fecha) return null;
    const days = differenceInDays(new Date(fecha), new Date());
    if (days < 0) return { expired: true, text: "Vencido" };
    if (days <= 30) return { warning: true, text: `Vence en ${days} días` };
    return null;
  };

  const vencSeguro = checkVencimiento(vehiculo.vencimiento_seguro);
  const vencCirculacion = checkVencimiento(vehiculo.vencimiento_circulacion);
  const alertaVencimiento = vencSeguro?.text ?? vencCirculacion?.text ?? null;
  const tieneAlerta = Boolean(vencSeguro || vencCirculacion);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={GV_LIST_CARD_CLASS}
      data-morph-hover-scope
    >
      <div className="flex items-start gap-3">
        <div className={GV_LIST_CARD_ICON_BOX_CLASS}>
          <CarIcon className="h-5 w-5 text-sky-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{vehiculo.placa}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
            {vehiculo.marca} {vehiculo.modelo}
          </p>
          {vehiculo.anio ? (
            <p className="text-xs font-semibold text-celeste-trifinio">Año {vehiculo.anio}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${estadoVehiculoBadgeClass(vehiculo.estado)}`}
          >
            {formatEstadoVehiculo(vehiculo.estado)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-sky-500/10 px-2 py-1 text-xs font-bold text-sky-600 dark:text-sky-400">
            <Route className="size-3" />
            {vehiculo.kilometraje_actual.toLocaleString("es-GT")} km
          </span>
        </div>
      </div>

      <div className={GV_LIST_CARD_SECTION_CLASS}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Documentación
        </p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-base font-semibold leading-snug",
              tieneAlerta ? "text-red-500" : "text-foreground",
            )}
          >
            {alertaVencimiento ?? "Al día"}
          </p>
          <span className={GV_LIST_CARD_CHIP_CLASS}>
            <Activity className="size-3 shrink-0 text-celeste-trifinio" />
            <span className="truncate">{tieneAlerta ? "Con alertas" : "Vigente"}</span>
          </span>
        </div>
        {tieneAlerta ? (
          <div className="mt-2 flex flex-col gap-1">
            {vencSeguro ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                <AlertTriangle className="size-3 shrink-0" />
                Seguro: {vencSeguro.text}
              </p>
            ) : null}
            {vencCirculacion ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                <AlertTriangle className="size-3 shrink-0" />
                Circulación: {vencCirculacion.text}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={cn(GV_LIST_CARD_FOOTER_CLASS, "gap-2")}>
        <SigetActionButton
          label="Entrar"
          accentColor={sigetAccent.abrir}
          morphFrom={LogIn}
          morphTo={ArrowRight}
          onClick={onDetail}
          ariaLabel={`Entrar a ${vehiculo.placa}`}
          className="w-auto shrink-0"
        />
        {canManage ? (
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
                onSelect={onEdit}
              >
                <GvMorphIcon icon={PenSquare} hoverIcon={Pencil} size={14} className="text-current" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 bg-white text-red-600 focus:bg-red-50 focus:text-red-600 dark:bg-zinc-900 dark:text-red-400 dark:focus:bg-red-950/60"
                onSelect={onDelete}
              >
                <GvMorphIcon icon={Trash2} hoverIcon={Trash} size={14} className="text-current" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </motion.div>
  );
}
