"use client";

import { differenceInDays } from "date-fns";
import {
  EllipsisVertical,
  MoreVertical,
  PenSquare,
  Pencil,
  FileSpreadsheet,
  ArrowDownToLine,
  Trash,
  Trash2,
  Image,
} from "lucide";
import { AlertTriangle, Car, Route } from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { GvSigetActionButton, sigetAccent } from "../lib/gv-siget-action-button";
import { type VehiculoRow } from "./lib/zod";
import { formatEstadoVehiculoLabel } from "./lib/helpers";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GvMobileRecordBadge,
  GvMobileRecordFooter,
  GvMobileRecordHeader,
  GvMobileRecordMeta,
  GvMobileRecordMetaRow,
  GvMobileRecordRow,
} from "../lib/gv-mobile-record";

function estadoVehiculoBadgeClass(estado: string) {
  switch (estado) {
    case "LIBRE":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
    case "RESERVADO":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400";
    case "EN_MANTENIMIENTO":
      return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export function VehiculoCard({
  vehiculo,
  onEdit,
  onOpenGaleria,
  onExportExcel,
  exporting = false,
  onDelete,
  canManage,
}: {
  vehiculo: VehiculoRow;
  onEdit: () => void;
  onOpenGaleria: () => void;
  onExportExcel: () => void;
  exporting?: boolean;
  onDelete: () => void;
  canManage: boolean;
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
  const tieneAlerta = Boolean(vencSeguro || vencCirculacion);

  return (
    <GvMobileRecordRow>
      <GvMobileRecordHeader
        title={
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{vehiculo.placa}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {vehiculo.marca} {vehiculo.modelo}
              {vehiculo.anio ? ` · ${vehiculo.anio}` : ""}
            </p>
          </div>
        }
        badge={
          <GvMobileRecordBadge className={estadoVehiculoBadgeClass(vehiculo.estado)}>
            {formatEstadoVehiculoLabel(vehiculo.estado)}
          </GvMobileRecordBadge>
        }
      />

      <GvMobileRecordMeta>
        <GvMobileRecordMetaRow icon={<Route className="size-3.5 text-celeste-trifinio" />}>
          <span className="tabular-nums font-semibold">
            {vehiculo.kilometraje_actual.toLocaleString("es-GT")} km
          </span>
        </GvMobileRecordMetaRow>
        {tieneAlerta ? (
          <GvMobileRecordMetaRow icon={<AlertTriangle className="size-3.5 text-red-500" />}>
            <span className="text-red-500">
              {vencSeguro?.text ?? vencCirculacion?.text}
            </span>
            {vencSeguro && vencCirculacion ? (
              <span className="text-xs text-red-400">
                Seguro y circulación con alerta
              </span>
            ) : null}
          </GvMobileRecordMetaRow>
        ) : (
          <GvMobileRecordMetaRow icon={<Car className="size-3.5 text-celeste-trifinio" />}>
            Documentación al día
          </GvMobileRecordMetaRow>
        )}
      </GvMobileRecordMeta>

      <GvMobileRecordFooter
        left={
          tieneAlerta ? (
            <span className="font-semibold text-red-500">Con alertas</span>
          ) : (
            <span className="font-semibold text-foreground">Vigente</span>
          )
        }
        right={
          <>
            <GvSigetActionButton
              label="Editar"
              accentColor={sigetAccent.editar}
              morphFrom={PenSquare}
              morphTo={Pencil}
              onClick={onEdit}
              ariaLabel={`Editar ${vehiculo.placa}`}
              className="h-8 w-auto shrink-0 rounded-lg px-3"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-sky-100 text-azul-trifinio transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900"
                  aria-label={`Más acciones de ${vehiculo.placa}`}
                >
                  <GvMorphIcon
                    icon={EllipsisVertical}
                    hoverIcon={MoreVertical}
                    size={16}
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
                  onSelect={onExportExcel}
                  disabled={exporting}
                >
                  <GvMorphIcon
                    icon={FileSpreadsheet}
                    hoverIcon={ArrowDownToLine}
                    size={14}
                    className="text-current"
                  />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2 bg-white text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800"
                  onSelect={onOpenGaleria}
                >
                  <GvMorphIcon icon={Image} hoverIcon={Image} size={14} morphOnHover={false} className="text-current" />
                  Fotos
                </DropdownMenuItem>
                {canManage ? (
                  <DropdownMenuItem
                    className={cn(
                      "cursor-pointer gap-2 bg-white text-red-600 focus:bg-red-50 focus:text-red-600 dark:bg-zinc-900 dark:text-red-400 dark:focus:bg-red-950/60",
                    )}
                    onSelect={onDelete}
                  >
                    <GvMorphIcon icon={Trash2} hoverIcon={Trash} size={14} className="text-current" />
                    Eliminar
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />
    </GvMobileRecordRow>
  );
}
