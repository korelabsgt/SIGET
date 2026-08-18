import { format } from "date-fns";
import { CheckCircle, XCircle, PlayCircle, StopCircle, Car, User } from "lucide-react";
import { type SolicitudRow } from "./lib/zod";
import { Button } from "@/components/ui/button";

export function SolicitudesList({
  solicitudes,
  onAction,
}: {
  solicitudes: SolicitudRow[];
  onAction: (solicitud: SolicitudRow, action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR") => void;
}) {

  if (solicitudes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 m-4">
        <p className="text-zinc-500 text-sm font-medium">No se encontraron solicitudes.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              <th className="px-6 py-4 w-1/3">DETALLES DE MISIÓN</th>
              <th className="px-6 py-4 w-1/4">FECHAS</th>
              <th className="px-6 py-4 w-1/4">ESTADO / VEHÍCULO</th>
              <th className="px-6 py-4 text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium text-foreground dark:divide-zinc-800">
            {solicitudes.map((sol) => (
              <tr key={sol.id} className="transition-colors hover:bg-muted/50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4 align-top">
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-sm text-foreground">{sol.destino}</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md w-fit">
                    <User className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[150px]">{sol.solicitante?.nombre || "Desconocido"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2 mt-1" title={sol.justificacion}>
                    {sol.justificacion}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 align-top text-xs text-muted-foreground">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <span className="uppercase text-[9px] font-bold text-zinc-400">Salida</span>
                    <span className="font-medium text-foreground">{format(new Date(sol.fecha_inicio), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="uppercase text-[9px] font-bold text-zinc-400">Retorno Estimado</span>
                    <span className="font-medium text-foreground">{format(new Date(sol.fecha_fin_estimada), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 align-top">
                <div className="flex flex-col gap-3 items-start">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    sol.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                    sol.estado === 'APROBADA' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                    sol.estado === 'EN_MISION' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                    sol.estado === 'RECHAZADA' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                    'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}>
                    {sol.estado.replace("_", " ")}
                  </span>
                  {sol.vehiculo ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="uppercase text-[9px] font-bold text-zinc-400">Asignado</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        <Car className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{sol.vehiculo.placa}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{sol.vehiculo.marca} {sol.vehiculo.modelo}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">Sin asignar</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 align-top text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  {sol.estado === "PENDIENTE" && (
                    <>
                      <Button size="sm" variant="outline" className="h-8 text-emerald-600 border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20 dark:text-emerald-400" onClick={() => onAction(sol, "APROBAR")}>
                        <CheckCircle className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Aprobar</span>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-900/20 dark:text-red-400" onClick={() => onAction(sol, "RECHAZAR")}>
                        <XCircle className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Rechazar</span>
                      </Button>
                    </>
                  )}
                  {sol.estado === "APROBADA" && (
                    <Button size="sm" variant="outline" className="h-8 text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-900/50 dark:hover:bg-blue-900/20 dark:text-blue-400" onClick={() => onAction(sol, "INICIAR")}>
                      <PlayCircle className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Iniciar Misión</span>
                    </Button>
                  )}
                  {sol.estado === "EN_MISION" && (
                    <Button size="sm" variant="outline" className="h-8 text-purple-600 border-purple-200 hover:text-purple-700 hover:bg-purple-50 hover:border-purple-300 dark:border-purple-900/50 dark:hover:bg-purple-900/20 dark:text-purple-400" onClick={() => onAction(sol, "FINALIZAR")}>
                      <StopCircle className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Finalizar Misión</span>
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
