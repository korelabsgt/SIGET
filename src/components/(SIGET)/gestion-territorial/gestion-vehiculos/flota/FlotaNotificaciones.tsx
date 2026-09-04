"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bell, BellRing, CircleAlert } from "lucide";
import { GvMorphIcon } from "../lib/morph-icon";
import { GvNotificacionItem, GvNotificacionesCampana } from "../lib/gv-notificaciones-ui";
import { useGvNotificacionesVistas } from "../lib/gv-notificaciones-vistas";
import { getFleetAllAlerts } from "./lib/helpers";
import { type VehiculoRow } from "./lib/zod";
import { cn } from "@/lib/utils";

export function FlotaNotificaciones({ vehiculos }: { vehiculos: VehiculoRow[] }) {
  const [open, setOpen] = useState(false);
  const alertas = getFleetAllAlerts(vehiculos);
  const total = alertas.length;
  const criticas = alertas.filter((a) => a.severidad === "error").length;
  const alertKey = useMemo(() => alertas.map((alerta) => alerta.id).sort().join("|"), [alertas]);
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
      badgeTone={criticas > 0 ? "critical" : "warn"}
      ariaLabel={`Alertas de flota${total > 0 ? `, ${total} pendientes` : ""}`}
    >
      <div className="border-b border-border bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio">
          Alertas de flota
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {total > 0
            ? `${total} aviso${total === 1 ? "" : "s"} · ${criticas} crítico${criticas === 1 ? "" : "s"}`
            : "Sin alertas activas"}
        </p>
      </div>

      {alertas.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <GvMorphIcon icon={Bell} hoverIcon={BellRing} size={32} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Todo al día</p>
          <p className="mt-1 text-xs text-muted-foreground">No hay alertas de documentos ni mantenimiento.</p>
        </div>
      ) : (
        <ul className="max-h-80 overflow-y-auto py-1">
          {alertas.map((alerta) => (
            <GvNotificacionItem
              key={alerta.id}
              tone={alerta.severidad === "error" ? "critical" : "warn"}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  alerta.severidad === "error"
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                )}
              >
                <GvMorphIcon icon={AlertTriangle} hoverIcon={CircleAlert} size={16} morphOnHover={false} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground">
                    {alerta.placa}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                      alerta.severidad === "error"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                    )}
                  >
                    {alerta.severidad === "error" ? "Crítico" : "Medio"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground">{alerta.titulo}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{alerta.detalle}</p>
              </div>
            </GvNotificacionItem>
          ))}
        </ul>
      )}
    </GvNotificacionesCampana>
  );
}
