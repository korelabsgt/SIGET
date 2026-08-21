"use client";

import { useState } from "react";
import { ArrowRight, LogIn } from "lucide";
import { GvMorphIcon } from "../lib/morph-icon";
import { type VehiculoRow } from "./lib/zod";
import { cn } from "@/lib/utils";

const cellPad = "px-3 py-3";

const estadoBadgeBase =
  "inline-flex h-9 w-[6.75rem] cursor-default items-center justify-center rounded-xl border-0 px-2 text-center text-[10px] font-bold uppercase tracking-wider";

function EstadoBadge({ estado }: { estado: VehiculoRow["estado"] }) {
  const colors: Record<VehiculoRow["estado"], string> = {
    LIBRE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    RESERVADO: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
    EN_MANTENIMIENTO:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  };

  return (
    <span className={cn(estadoBadgeBase, colors[estado])}>
      {estado.replace("_", " ")}
    </span>
  );
}

function VehiculoListRow({
  vehiculo,
  index,
  onDetail,
}: {
  vehiculo: VehiculoRow;
  index: number;
  onDetail: (vehiculo: VehiculoRow) => void;
}) {
  const [rowHover, setRowHover] = useState(false);

  return (
    <tr
      className="border-b border-border last:border-0 transition-colors hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20"
      onMouseEnter={() => setRowHover(true)}
      onMouseLeave={() => setRowHover(false)}
    >
      <td
        className={cn(
          cellPad,
          "w-0 whitespace-nowrap text-center align-middle tabular-nums font-medium text-muted-foreground",
        )}
      >
        {index + 1}
      </td>
      <td className={cn(cellPad, "w-0 whitespace-nowrap align-middle")}>
        <span className="inline-flex min-w-[5.5rem] items-center justify-center whitespace-nowrap rounded-lg bg-zinc-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-foreground dark:bg-zinc-700">
          {vehiculo.placa}
        </span>
      </td>
      <td className={cn(cellPad, "w-full align-middle")}>
        <span className="inline-flex max-w-full items-baseline gap-1.5 truncate capitalize">
          <span className="font-semibold text-foreground">{vehiculo.marca}</span>
          <span className="truncate text-sm text-muted-foreground">{vehiculo.modelo}</span>
        </span>
      </td>
      <td className={cn(cellPad, "text-center align-middle")}>
        <EstadoBadge estado={vehiculo.estado} />
      </td>
      <td className={cn(cellPad, "w-0 whitespace-nowrap text-center align-middle")}>
        <button
          type="button"
          onClick={() => onDetail(vehiculo)}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-celeste-trifinio px-3.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          aria-label={`Entrar a ${vehiculo.placa}`}
        >
          <GvMorphIcon
            icon={LogIn}
            hoverIcon={ArrowRight}
            size={14}
            externalHover={rowHover}
          />
          Entrar
        </button>
      </td>
    </tr>
  );
}

export function VehiculosList({
  vehiculos,
  onDetail,
}: {
  vehiculos: VehiculoRow[];
  onDetail: (vehiculo: VehiculoRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-sky-50/80 text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio dark:border-zinc-700 dark:bg-sky-950/30">
            <th className={cn(cellPad, "w-0 whitespace-nowrap text-center")}>No.</th>
            <th className={cn(cellPad, "w-0 whitespace-nowrap text-left")}>Placa</th>
            <th className={cn(cellPad, "w-full text-left")}>Marca / modelo</th>
            <th className={cn(cellPad, "text-center")}>Estado</th>
            <th className={cn(cellPad, "w-0 whitespace-nowrap text-center")}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vehiculos.map((vehiculo, index) => (
            <VehiculoListRow
              key={vehiculo.id}
              vehiculo={vehiculo}
              index={index}
              onDetail={onDetail}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
