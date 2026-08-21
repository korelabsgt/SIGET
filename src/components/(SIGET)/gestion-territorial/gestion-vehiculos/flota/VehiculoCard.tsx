import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarDays,
  Car,
  CarFront,
  CircleAlert,
  LogIn,
  PenSquare,
  Pencil,
  Trash,
  Trash2,
  TrendingUp,
} from "lucide";
import { GvMorphIcon } from "../lib/morph-icon";
import { type VehiculoRow } from "./lib/zod";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

export function VehiculoCard({
  vehiculo,
  onDetail,
  onEdit,
  onDelete,
}: {
  vehiculo: VehiculoRow;
  onDetail: () => void;
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
    <div className="relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50" data-morph-hover-scope>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-azul-trifinio/10 text-azul-trifinio">
            <GvMorphIcon icon={Car} hoverIcon={CarFront} size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">
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
            getEstadoColor(vehiculo.estado),
          )}
        >
          {vehiculo.estado.replace("_", " ")}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <GvMorphIcon icon={Activity} hoverIcon={TrendingUp} size={12} />
            Kilometraje
          </span>
          <span className="text-sm font-semibold text-foreground">
            {vehiculo.kilometraje_actual.toLocaleString()} km
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <GvMorphIcon icon={Calendar} hoverIcon={CalendarDays} size={12} />
            Año
          </span>
          <span className="text-sm font-semibold text-foreground">
            {vehiculo.anio || "N/A"}
          </span>
        </div>
      </div>

      {(vencSeguro || vencCirculacion) && (
        <div className="mb-4 mt-auto flex flex-col gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-red-500">
            <GvMorphIcon icon={AlertTriangle} hoverIcon={CircleAlert} size={16} />
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

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onDetail}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-celeste-trifinio px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          <GvMorphIcon icon={LogIn} hoverIcon={ArrowRight} size={16} />
          ENTRAR
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-azul-trifinio/10 px-3 py-2 text-xs font-bold text-azul-trifinio transition-colors hover:bg-azul-trifinio/20"
        >
          <GvMorphIcon icon={PenSquare} hoverIcon={Pencil} size={16} />
          EDITAR
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/20"
        >
          <GvMorphIcon icon={Trash2} hoverIcon={Trash} size={16} />
          ELIMINAR
        </button>
      </div>
    </div>
  );
}
