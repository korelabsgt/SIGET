"use client";

import { useMemo, useState } from "react";
import { Bell, BellRing, CalendarClock, Clock } from "lucide";
import { AlertTriangle } from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { GvNotificacionItem, GvNotificacionesCampana } from "../lib/gv-notificaciones-ui";
import { useGvNotificacionesVistas } from "../lib/gv-notificaciones-vistas";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import { cn } from "@/lib/utils";
import { solicitudPendienteVencida } from "./lib/helpers";
import { type SolicitudRow } from "./lib/zod";

export function SolicitudesNotificaciones({ solicitudes }: { solicitudes: SolicitudRow[] }) {
  const [open, setOpen] = useState(false);
  const pendientes = solicitudes.filter((sol) => sol.estado === "PENDIENTE");
  const vencidas = pendientes.filter(solicitudPendienteVencida);
  const total = pendientes.length;
  const totalVencidas = vencidas.length;
  const hayVencidas = totalVencidas > 0;
  const alertKey = useMemo(
    () => pendientes.map((solicitud) => solicitud.id).sort().join("|"),
    [pendientes],
  );
  const { showBadge, markSeen } = useGvNotificacionesVistas(alertKey, total);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) markSeen();
  };

  return (
    <GvNotificacionesCampana
      open={open}
      onOpenChange={handleOpenChange}
      showBadge={showBadge}
      badgeCount={total}
      badgeTone={hayVencidas ? "critical" : "warn"}
      ariaLabel={`Solicitudes pendientes${total > 0 ? `, ${total}` : ""}${hayVencidas ? `, ${totalVencidas} vencidas` : ""}`}
    >
      <div
        className={cn(
          "border-b border-border px-4 py-3 dark:border-zinc-700",
          hayVencidas ? "bg-red-50 dark:bg-red-950/30" : "bg-zinc-50 dark:bg-zinc-800",
        )}
      >
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            hayVencidas ? "text-red-600 dark:text-red-400" : "text-celeste-trifinio",
          )}
        >
          Solicitudes pendientes
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {total > 0
            ? hayVencidas
              ? `${totalVencidas} vencida${totalVencidas === 1 ? "" : "s"} · ${total} por revisar`
              : `${total} solicitud${total === 1 ? "" : "es"} por revisar`
            : "Sin solicitudes pendientes de aprobación"}
        </p>
      </div>

      {pendientes.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <GvMorphIcon icon={Bell} hoverIcon={BellRing} size={32} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Todo al día</p>
          <p className="mt-1 text-xs text-muted-foreground">No hay solicitudes esperando aprobación.</p>
        </div>
      ) : (
        <ul className="max-h-80 overflow-y-auto py-1">
          {pendientes.map((solicitud) => {
            const vencida = solicitudPendienteVencida(solicitud);

            return (
              <GvNotificacionItem key={solicitud.id} tone={vencida ? "critical" : "warn"}>
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    vencida
                      ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                  )}
                >
                  {vencida ? (
                    <AlertTriangle className="size-4 shrink-0" />
                  ) : (
                    <GvMorphIcon icon={CalendarClock} hoverIcon={Clock} size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-foreground">
                      {solicitud.solicitante?.nombre || "Solicitante"}
                    </p>
                    {vencida ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-950 dark:text-red-400">
                        Vencida
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs font-semibold text-foreground">{solicitud.destino}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs",
                      vencida ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground",
                    )}
                  >
                    Salida: {formatFechaHoraGv(solicitud.fecha_inicio)}
                  </p>
                </div>
              </GvNotificacionItem>
            );
          })}
        </ul>
      )}
    </GvNotificacionesCampana>
  );
}
