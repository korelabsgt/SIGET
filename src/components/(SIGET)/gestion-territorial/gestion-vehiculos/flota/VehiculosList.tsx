import { type VehiculoRow } from "./lib/zod";
import { cn } from "@/lib/utils";
import { PenSquare, Trash2, MoreVertical, FileText, Wrench } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getDocumentAlertStatus, getMantenimientoAlertStatus } from "./lib/alerts";

export function VehiculosList({
  vehiculos,
  onEdit,
  onDelete,
}: {
  vehiculos: VehiculoRow[];
  onEdit: (vehiculo: VehiculoRow) => void;
  onDelete: (vehiculo: VehiculoRow) => void;
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

  const getVencimientoStatus = (fecha: string | null | undefined) => {
    if (!fecha) return <span className="text-muted-foreground">-</span>;
    const days = differenceInDays(new Date(fecha), new Date());
    const formatted = format(new Date(fecha), "dd MMM yyyy", { locale: es });
    if (days < 0) {
      return <span className="text-red-500 font-bold">{formatted} (Vencido)</span>;
    }
    if (days <= 30) {
      return <span className="text-orange-500 font-bold">{formatted} (Próximo)</span>;
    }
    return <span className="text-foreground">{formatted}</span>;
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              <th className="px-6 py-4">NO.</th>
              <th className="px-6 py-4">PLACA</th>
              <th className="px-6 py-4">MARCA / MODELO</th>
              <th className="px-6 py-4">KILOMETRAJE</th>
              <th className="px-6 py-4">ESTADO</th>
              <th className="px-6 py-4">AÑO / COLOR</th>
              <th className="px-6 py-4">VENCIMIENTOS</th>
              <th className="px-6 py-4 text-center">ALERTAS</th>
              <th className="px-6 py-4 text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium text-foreground dark:divide-zinc-800">
            {vehiculos.map((vehiculo, index) => (
              <tr
                key={vehiculo.id}
                className="transition-colors hover:bg-muted/50 dark:hover:bg-zinc-800/50"
              >
                <td className="px-6 py-4 text-muted-foreground">{index + 1}</td>
                <td className="px-6 py-4 font-bold uppercase">{vehiculo.placa}</td>
                <td className="px-6 py-4">
                  <span className="block text-foreground">{vehiculo.marca}</span>
                  <span className="block text-xs text-muted-foreground">{vehiculo.modelo}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-azul-trifinio/10 px-2 py-1 text-xs font-bold text-azul-trifinio">
                    {vehiculo.kilometraje_actual.toLocaleString()} km
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      getEstadoColor(vehiculo.estado)
                    )}
                  >
                    {vehiculo.estado.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {vehiculo.anio || "N/A"} / <span className="capitalize">{vehiculo.color}</span>
                </td>
                <td className="px-6 py-4 text-xs">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">Seguro:</span>
                      {getVencimientoStatus(vehiculo.vencimiento_seguro)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">Circ.:</span>
                      {getVencimientoStatus(vehiculo.vencimiento_circulacion)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border shadow-sm",
                            getDocumentAlertStatus(vehiculo.vencimiento_seguro, vehiculo.vencimiento_circulacion) === "VERDE" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                            getDocumentAlertStatus(vehiculo.vencimiento_seguro, vehiculo.vencimiento_circulacion) === "AMARILLO" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-red-500/10 text-red-500 border-red-500/20"
                          )}>
                            <FileText className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {getDocumentAlertStatus(vehiculo.vencimiento_seguro, vehiculo.vencimiento_circulacion) === "VERDE" ? "Documentación al día" :
                           getDocumentAlertStatus(vehiculo.vencimiento_seguro, vehiculo.vencimiento_circulacion) === "AMARILLO" ? "Documentos próximos a vencer" :
                           "Documentos vencidos o faltantes"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border shadow-sm",
                            getMantenimientoAlertStatus(vehiculo.kilometraje_actual).estado === "VERDE" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                            getMantenimientoAlertStatus(vehiculo.kilometraje_actual).estado === "AMARILLO" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-red-500/10 text-red-500 border-red-500/20"
                          )}>
                            <Wrench className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {getMantenimientoAlertStatus(vehiculo.kilometraje_actual).estado === "VERDE" ? 
                            `Faltan ${getMantenimientoAlertStatus(vehiculo.kilometraje_actual).kmFaltantes.toLocaleString()} km para el próximo servicio` :
                           getMantenimientoAlertStatus(vehiculo.kilometraje_actual).estado === "AMARILLO" ? 
                            `Próximo servicio en ${getMantenimientoAlertStatus(vehiculo.kilometraje_actual).kmFaltantes.toLocaleString()} km` :
                            "Mantenimiento preventivo requerido / vencido"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-zinc-800">
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => onEdit(vehiculo)}
                        className="flex items-center gap-2 font-semibold text-azul-trifinio focus:bg-azul-trifinio/10 focus:text-azul-trifinio"
                      >
                        <PenSquare className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(vehiculo)}
                        className="flex items-center gap-2 font-semibold text-red-500 focus:bg-red-500/10 focus:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {vehiculos.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                  No se encontraron vehículos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
