import { Eye } from "lucide-react";
import { type VehiculoRow } from "./lib/zod";
import { cn } from "@/lib/utils";

const cellPad = "px-3 py-3";

function EstadoBadge({ estado }: { estado: VehiculoRow["estado"] }) {
  const colors: Record<VehiculoRow["estado"], string> = {
    LIBRE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    RESERVADO: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
    EN_MANTENIMIENTO: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        colors[estado],
      )}
    >
      {estado.replace("_", " ")}
    </span>
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
      <table className="w-full table-fixed text-sm">
        <colgroup>{[
          <col key="no" />,
          <col key="placa" />,
          <col key="marca" />,
          <col key="estado" />,
          <col key="acciones" />,
        ]}</colgroup>
        <thead>
          <tr className="border-b border-border bg-sky-50/80 text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio dark:border-zinc-700 dark:bg-sky-950/30">{[
            <th key="no" className={cn(cellPad, "text-center")}>No.</th>,
            <th key="placa" className={cn(cellPad, "text-left")}>Placa</th>,
            <th key="marca" className={cn(cellPad, "text-left")}>Marca / modelo</th>,
            <th key="estado" className={cn(cellPad, "text-center")}>Estado</th>,
            <th key="acciones" className={cn(cellPad, "text-center")}>Acciones</th>,
          ]}</tr>
        </thead>
        <tbody>
          {vehiculos.map((vehiculo, index) => (
            <tr
              key={vehiculo.id}
              className="border-b border-border last:border-0 transition-colors hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20"
            >{[
              <td
                key="no"
                className={cn(cellPad, "text-center align-middle tabular-nums font-medium text-muted-foreground")}
              >
                {index + 1}
              </td>,
              <td key="placa" className={cn(cellPad, "align-middle")}>
                <span className="inline-flex rounded-lg bg-zinc-100 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-foreground dark:bg-zinc-700">
                  {vehiculo.placa}
                </span>
              </td>,
              <td key="marca" className={cn(cellPad, "align-middle")}>
                <span className="inline-flex max-w-full items-baseline gap-1.5 truncate capitalize">
                  <span className="font-semibold text-foreground">{vehiculo.marca}</span>
                  <span className="truncate text-sm text-muted-foreground">{vehiculo.modelo}</span>
                </span>
              </td>,
              <td key="estado" className={cn(cellPad, "text-center align-middle")}>
                <EstadoBadge estado={vehiculo.estado} />
              </td>,
              <td key="acciones" className={cn(cellPad, "text-center align-middle")}>
                <button
                  type="button"
                  onClick={() => onDetail(vehiculo)}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-celeste-trifinio px-3.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                  aria-label={`Detalle de ${vehiculo.placa}`}
                >
                  <Eye className="size-3.5" />
                  Detalle
                </button>
              </td>,
            ]}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
