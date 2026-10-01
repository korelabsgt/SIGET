"use client";

import { CarFront, Image, Loader2, PenSquare, Pencil, FileSpreadsheet, ArrowDownToLine } from "lucide";
import { GvSigetActionButton, sigetAccent } from "../lib/gv-siget-action-button";
import {
  GestionVehiculosActionCell,
  GestionVehiculosTableScroll,
  gvTableActionTdClass,
  gvTableActionThClass,
} from "../lib/table-ui";
import { GvTableMorphRow } from "../lib/gv-table-morph-row";
import { GvMorphIcon } from "../lib/morph-icon";
import { type VehiculoRow } from "./lib/zod";
import { formatEstadoVehiculoLabel, fotosUnidadVehiculo } from "./lib/helpers";
import {
  resolveStorageDisplaySrc,
  useSignedStorageUrls,
} from "../lib/storage-hooks";
import { cn } from "@/lib/utils";

const cellPad = "px-3 py-3";
const marcaModeloCell = "pl-2.5 pr-4";
const colorCell = "pl-4 pr-2";
const colDivider = "border-r border-border dark:border-zinc-800";

function anchosColumnasFlota(canManage: boolean) {
  return {
    no: "w-[5%]",
    placa: "w-[11%]",
    km: "w-[9%]",
    foto: "w-[8%]",
    marca: "w-[20%]",
    color: "w-[12%]",
    estado: canManage ? "w-[15%]" : "w-[35%]",
    acciones: "w-[20%]",
  };
}

const estadoBadgeBase =
  "inline-flex h-9 min-w-[6.75rem] cursor-default items-center justify-center rounded-xl border-0 px-2 text-center text-[10px] font-bold uppercase tracking-wider";

function EstadoBadge({
  estado,
  onVerReserva,
  onVerReservaIndividual,
}: {
  estado: VehiculoRow["estado"];
  onVerReserva?: () => void;
  onVerReservaIndividual?: () => void;
}) {
  const colors: Record<VehiculoRow["estado"], string> = {
    LIBRE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    RESERVADO: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
    EN_MANTENIMIENTO:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
    RESERVA_INDIVIDUAL:
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  };

  const label = formatEstadoVehiculoLabel(estado);
  const onDetalle =
    estado === "RESERVADO" && onVerReserva
      ? onVerReserva
      : estado === "RESERVA_INDIVIDUAL" && onVerReservaIndividual
        ? onVerReservaIndividual
        : undefined;

  if (onDetalle) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={onDetalle}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          onDetalle();
        }}
        className={cn(
          estadoBadgeBase,
          colors[estado],
          "cursor-pointer transition-opacity hover:opacity-90",
        )}
        aria-label={
          estado === "RESERVA_INDIVIDUAL"
            ? `Ver reserva individual: ${label}`
            : `Ver reserva: ${label}`
        }
      >
        {label}
      </span>
    );
  }

  return <span className={cn(estadoBadgeBase, colors[estado])}>{label}</span>;
}

function VehiculoTablaFoto({
  vehiculo,
  onOpenGaleria,
}: {
  vehiculo: VehiculoRow;
  onOpenGaleria: (vehiculo: VehiculoRow) => void;
}) {
  const fotos = fotosUnidadVehiculo(vehiculo);
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
  onVerReserva,
  onVerReservaIndividual,
  exporting,
  canManage,
}: {
  vehiculo: VehiculoRow;
  index: number;
  onEdit: (vehiculo: VehiculoRow) => void;
  onOpenGaleria: (vehiculo: VehiculoRow) => void;
  onExportExcel: (vehiculo: VehiculoRow) => void;
  onVerReserva: (vehiculo: VehiculoRow) => void;
  onVerReservaIndividual: (vehiculo: VehiculoRow) => void;
  exporting: boolean;
  canManage: boolean;
}) {
  const col = anchosColumnasFlota(canManage);

  return (
    <GvTableMorphRow>
      <td
        className={cn(
          cellPad,
          colDivider,
          col.no,
          "whitespace-nowrap text-center align-middle tabular-nums font-medium text-muted-foreground",
        )}
      >
        {index + 1}
      </td>
      <td className={cn(cellPad, colDivider, col.placa, "whitespace-nowrap text-center align-middle")}>
        <span className="inline-flex min-w-[5.5rem] items-center justify-center whitespace-nowrap rounded-lg bg-zinc-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-foreground dark:bg-zinc-700">
          {vehiculo.placa}
        </span>
      </td>
      <td className={cn(cellPad, colDivider, col.km, "whitespace-nowrap text-right align-middle")}>
        <span className="inline-flex w-full min-w-0 items-baseline justify-end gap-0.5 whitespace-nowrap tabular-nums">
          <span className="text-sm font-semibold text-foreground">
            {vehiculo.kilometraje_actual.toLocaleString("es-GT")}
          </span>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            km
          </span>
        </span>
      </td>
      <td className={cn(cellPad, colDivider, col.foto, "pr-2.5 text-center align-middle")}>
        <VehiculoTablaFoto vehiculo={vehiculo} onOpenGaleria={onOpenGaleria} />
      </td>
      <td
        className={cn(
          cellPad,
          colDivider,
          col.marca,
          "whitespace-nowrap text-center align-middle",
          marcaModeloCell,
        )}
      >
        <span className="inline-flex max-w-full flex-col items-center leading-tight capitalize">
          <span className="font-semibold text-foreground">{vehiculo.marca}</span>
          <span className="truncate text-sm text-muted-foreground">{vehiculo.modelo}</span>
        </span>
      </td>
      <td
        className={cn(
          cellPad,
          colDivider,
          col.color,
          "whitespace-nowrap text-center align-middle capitalize",
          colorCell,
        )}
      >
        <span className="text-sm text-foreground">{vehiculo.color?.trim() || "—"}</span>
      </td>
      <td
        className={cn(
          cellPad,
          canManage ? colDivider : undefined,
          col.estado,
          "whitespace-nowrap text-center align-middle",
        )}
      >
        <EstadoBadge
          estado={vehiculo.estado}
          onVerReserva={
            vehiculo.estado === "RESERVADO"
              ? () => onVerReserva(vehiculo)
              : undefined
          }
          onVerReservaIndividual={
            vehiculo.estado === "RESERVA_INDIVIDUAL"
              ? () => onVerReservaIndividual(vehiculo)
              : undefined
          }
        />
      </td>
      {canManage ? (
        <td className={cn(gvTableActionTdClass, col.acciones)}>
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
              <GvSigetActionButton
                label="Editar"
                accentColor={sigetAccent.editar}
                morphFrom={PenSquare}
                morphTo={Pencil}
                onClick={() => onEdit(vehiculo)}
                ariaLabel={`Editar ${vehiculo.placa}`}
                className="w-auto shrink-0"
              />
            </div>
          </GestionVehiculosActionCell>
        </td>
      ) : null}
    </GvTableMorphRow>
  );
}

export function VehiculosList({
  vehiculos,
  onEdit,
  onOpenGaleria,
  onExportExcel,
  onVerReserva,
  onVerReservaIndividual,
  exportingVehiculoId = null,
  canManage,
  rowOffset = 0,
}: {
  vehiculos: VehiculoRow[];
  onEdit: (vehiculo: VehiculoRow) => void;
  onOpenGaleria: (vehiculo: VehiculoRow) => void;
  onExportExcel: (vehiculo: VehiculoRow) => void;
  onVerReserva: (vehiculo: VehiculoRow) => void;
  onVerReservaIndividual: (vehiculo: VehiculoRow) => void;
  exportingVehiculoId?: string | null;
  canManage: boolean;
  rowOffset?: number;
}) {
  const col = anchosColumnasFlota(canManage);

  return (
    <div className="w-full min-w-0">
      <GestionVehiculosTableScroll pageScroll>
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-sky-50/80 text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio dark:border-zinc-700 dark:bg-sky-950/30">
            <th className={cn(cellPad, colDivider, col.no, "whitespace-nowrap text-center")}>
              No.
            </th>
            <th className={cn(cellPad, colDivider, col.placa, "whitespace-nowrap text-center")}>
              Placa
            </th>
            <th className={cn(cellPad, colDivider, col.km, "whitespace-nowrap text-center")}>
              Km
            </th>
            <th className={cn(cellPad, colDivider, col.foto, "whitespace-nowrap pr-2.5 text-center")}>
              Foto
            </th>
            <th
              className={cn(
                cellPad,
                colDivider,
                col.marca,
                "whitespace-nowrap text-center",
                marcaModeloCell,
              )}
            >
              <span className="inline-flex flex-col items-center leading-tight">
                <span>Marca</span>
                <span>Modelo</span>
              </span>
            </th>
            <th className={cn(cellPad, colDivider, col.color, "whitespace-nowrap text-center", colorCell)}>
              Color
            </th>
            <th
              className={cn(
                cellPad,
                canManage ? colDivider : undefined,
                col.estado,
                "whitespace-nowrap text-center",
              )}
            >
              Estado
            </th>
            {canManage ? (
              <th className={cn(gvTableActionThClass, col.acciones)}>Acciones</th>
            ) : null}
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
              onVerReserva={onVerReserva}
              onVerReservaIndividual={onVerReservaIndividual}
              exporting={exportingVehiculoId === (vehiculo.id ?? vehiculo.placa)}
              canManage={canManage}
            />
          ))}
        </tbody>
      </table>
      </GestionVehiculosTableScroll>
    </div>
  );
}
