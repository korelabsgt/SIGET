import { Car, Calendar, Activity, AlertTriangle, PenSquare, Trash2, Clock } from "lucide-react";
import { type VehiculoRow } from "./lib/zod";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

export function VehiculoCard({
  vehiculo,
  onEdit,
  onDelete,
}: {
  vehiculo: VehiculoRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "LIBRE":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "RESERVADO":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "EN_MANTENIMIENTO":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  const checkVencimiento = (fecha: string | null | undefined) => {
    if (!fecha) return null;
    const days = differenceInDays(new Date(fecha), new Date());
    if (days < 0) return { expired: true, text: "Vencido" };
    if (days <= 30) return { warning: true, text: `Vence en ${days} días` };
    return null;
  };

  const vencSeguro = checkVencimiento(vehiculo.vencimiento_seguro);
  const vencCirculacion = checkVencimiento(vehiculo.vencimiento_circulacion);

  return (
    <div className="relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-azul-trifinio/10 text-azul-trifinio">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg uppercase tracking-wider">
              {vehiculo.placa}
            </h3>
            <p className="text-sm font-medium text-muted-foreground">
              {vehiculo.marca} {vehiculo.modelo}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
            getEstadoColor(vehiculo.estado)
          )}
        >
          {vehiculo.estado.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3 w-3" />
            Kilometraje
          </span>
          <span className="text-sm font-semibold text-foreground">
            {vehiculo.kilometraje_actual.toLocaleString()} km
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Año
          </span>
          <span className="text-sm font-semibold text-foreground">
            {vehiculo.anio || "N/A"}
          </span>
        </div>
      </div>

      {(vencSeguro || vencCirculacion) && (
        <div className="mt-auto mb-4 flex flex-col gap-2 rounded-xl bg-red-500/10 p-3 border border-red-500/20">
          <div className="flex items-center gap-2 text-xs font-bold text-red-500">
            <AlertTriangle className="h-4 w-4" />
            <span>Alertas de Vencimiento</span>
          </div>
          {vencSeguro && (
            <div className="flex items-center justify-between text-xs font-medium text-red-400">
              <span>Seguro:</span>
              <span>{vencSeguro.text}</span>
            </div>
          )}
          {vencCirculacion && (
            <div className="flex items-center justify-between text-xs font-medium text-red-400">
              <span>Circulación:</span>
              <span>{vencCirculacion.text}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center gap-2 border-t border-border dark:border-zinc-800">
        <button
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-azul-trifinio/10 px-3 py-2 text-xs font-bold text-azul-trifinio transition-colors hover:bg-azul-trifinio/20"
        >
          <PenSquare className="h-4 w-4" />
          EDITAR
        </button>
        <button
          onClick={onDelete}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" />
          ELIMINAR
        </button>
      </div>
    </div>
  );
}
