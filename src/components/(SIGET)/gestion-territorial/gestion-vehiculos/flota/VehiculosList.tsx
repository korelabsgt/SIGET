"use client";

import { CarFront, Image, Loader2, PenSquare, Pencil, FileSpreadsheet, ArrowDownToLine } from "lucide";
import { GvSigetActionButton, sigetAccent } from "../lib/gv-siget-action-button";
import { GestionVehiculosActionCell, gvTableActionTdClass, gvTableActionThClass } from "../lib/table-ui";
import { GvTableMorphRow } from "../lib/gv-table-morph-row";
import { GvMorphIcon } from "../lib/morph-icon";
import { type VehiculoRow } from "./lib/zod";
import { formatEstadoVehiculoLabel, fotosVehiculo } from "./lib/helpers";
import {
  resolveStorageDisplaySrc,
  useSignedStorageUrls,
} from "../lib/storage-hooks";
import { cn } from "@/lib/utils";

const cellPad = "px-3 py-3";

const estadoBadgeBase =
  "inline-flex h-9 min-w-[6.75rem] cursor-default items-center justify-center rounded-xl border-0 px-2 text-center text-[10px] font-bold uppercase tracking-wider";

function EstadoBadge({ estado }: { estado: VehiculoRow["estado"] }) {
  const colors: Record<VehiculoRow["estado"], string> = {
    LIBRE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    RESERVADO: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
    EN_MANTENIMIENTO:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  };

  return (
    <span className={cn(estadoBadgeBase, colors[estado])}>
      {formatEstadoVehiculoLabel(estado)}
    </span>
  );
}

function VehiculoTablaFoto({
  vehiculo,
  onOpenGaleria,
}: {
  vehiculo: VehiculoRow;
  onOpenGaleria: (vehiculo: VehiculoRow) => void;
}) {
  const fotos = fotosVehiculo(vehiculo);
  const { data: signedMap = {}, isLoading } = useSignedStorageUrls(fotos.slice(0, 1));
  const primeraSrc = fotos[0] ? resolveStorageDisplaySrc(fotos[0], signedMap) : "";

  return (
    <button
      type="button"
      onClick={() => onOpenGaleria(vehiculo)}
      className="relative mx-auto flex size-12 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-celeste-trifinio/30 bg-sky-50/60 transition-colors hover:ring-2 hover:ring-celeste-trifinio/40 dark:bg-sky-950/20"
      aria-label={`Ver fotografías de ${vehiculo.placa}`}
    >
      {isLoading && fotos.length > 0 ? (
        <span className="inline-flex animate-spin text-celeste-trifinio">
          <GvMorphIcon icon={Loader2} size={20} morphOnHover={false} />
        </span>
      ) : primeraSrc ? (
        <img src={primeraSrc} alt="" className="size-full object-cover" />
      ) : (
        <GvMorphIcon icon={Image} hoverIcon={CarFront} size={20} className="text-celeste-trifinio/70" />
      )}
    </button>
  );
}

function VehiculoListRow({
  vehiculo,
  index,
  onEdit,
  onOpenGaleria,
  onExportExcel,
  exporting,
  canManage,
}: {
  vehiculo: VehiculoRow;
  index: number;
  onEdit: (vehiculo: VehiculoRow) => void;
  onOpenGaleria: (vehiculo: VehiculoRow) => void;
  onExportExcel: (vehiculo: VehiculoRow) => void;
  exporting: boolean;
  canManage: boolean;
}) {
  return (
    <GvTableMorphRow>
      <td
        className={cn(
          cellPad,
          "w-0 whitespace-nowrap text-center align-middle tabular-nums font-medium text-muted-foreground",
        )}
      >
        {index + 1}
      </td>
      <td className={cn(cellPad, "w-0 whitespace-nowrap text-center align-middle")}>
        <span className="inline-flex min-w-[5.5rem] items-center justify-center whitespace-nowrap rounded-lg bg-zinc-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-foreground dark:bg-zinc-700">
          {vehiculo.placa}
        </span>
      </td>
      <td className={cn(cellPad, "w-0 pr-2.5 text-center align-middle")}>
        <VehiculoTablaFoto vehiculo={vehiculo} onOpenGaleria={onOpenGaleria} />
      </td>
      <td className={cn(cellPad, "w-full pl-2.5 text-left align-middle")}>
        <span className="inline-flex max-w-full items-baseline gap-1.5 truncate capitalize">
          <span className="font-semibold text-foreground">{vehiculo.marca}</span>
          <span className="truncate text-sm text-muted-foreground">{vehiculo.modelo}</span>
        </span>
      </td>
      <td className={cn(cellPad, "text-center align-middle")}>
        <EstadoBadge estado={vehiculo.estado} />
      </td>
      <td className={gvTableActionTdClass}>
        <GestionVehiculosActionCell>
          <div className="flex items-center justify-center gap-2">
            <GvSigetActionButton
              label="Excel"
              accentColor={sigetAccent.excel}
              morphFrom={FileSpreadsheet}
              morphTo={ArrowDownToLine}
              onClick={() => onExportExcel(vehiculo)}
              disabled={exporting}
              ariaLabel={`Descargar Excel de ${vehiculo.placa}`}
              className="w-auto shrink-0"
            />
            {canManage ? (
              <GvSigetActionButton
                label="Editar"
                accentColor={sigetAccent.editar}
                morphFrom={PenSquare}
                morphTo={Pencil}
                onClick={() => onEdit(vehiculo)}
                ariaLabel={`Editar ${vehiculo.placa}`}
                className="w-auto shrink-0"
              />
            ) : null}
          </div>
        </GestionVehiculosActionCell>
      </td>
    </GvTableMorphRow>
  );
}

export function VehiculosList({
  vehiculos,
  onEdit,
  onOpenGaleria,
  onExportExcel,
  exportingVehiculoId = null,
  canManage,
  rowOffset = 0,
}: {
  vehiculos: VehiculoRow[];
  onEdit: (vehiculo: VehiculoRow) => void;
  onOpenGaleria: (vehiculo: VehiculoRow) => void;
  onExportExcel: (vehiculo: VehiculoRow) => void;
  exportingVehiculoId?: string | null;
  canManage: boolean;
  rowOffset?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-sky-50/80 text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio dark:border-zinc-700 dark:bg-sky-950/30">
            <th className={cn(cellPad, "w-0 whitespace-nowrap text-center")}>No.</th>
            <th className={cn(cellPad, "w-0 whitespace-nowrap text-center")}>Placa</th>
            <th className={cn(cellPad, "w-0 whitespace-nowrap pr-2.5 text-center")}>Foto</th>
            <th className={cn(cellPad, "w-full pl-2.5 text-left")}>Marca / modelo</th>
            <th className={cn(cellPad, "text-center")}>Estado</th>
            <th className={gvTableActionThClass}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vehiculos.map((vehiculo, index) => (
            <VehiculoListRow
              key={vehiculo.id}
              vehiculo={vehiculo}
              index={rowOffset + index}
              onEdit={onEdit}
              onOpenGaleria={onOpenGaleria}
              onExportExcel={onExportExcel}
              exporting={exportingVehiculoId === (vehiculo.id ?? vehiculo.placa)}
              canManage={canManage}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
