"use client";

import { useMemo, useState } from "react";
import { Bell, BellRing, CircleAlert, FileQuestion, Fuel } from "lucide";
import { AlertTriangle } from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { GvNotificacionItem, GvNotificacionesCampana } from "../lib/gv-notificaciones-ui";
import { useGvNotificacionesVistas } from "../lib/gv-notificaciones-vistas";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import { cn } from "@/lib/utils";
import { getBitacoraAlerts } from "./lib/helpers";
import { type BitacoraRow } from "./lib/zod";

export function BitacorasNotificaciones({ bitacoras }: { bitacoras: BitacoraRow[] }) {
  const [open, setOpen] = useState(false);
  const alertas = getBitacoraAlerts(bitacoras);
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
      ariaLabel={`Alertas de bitácoras${total > 0 ? `, ${total} pendientes` : ""}`}
    >
      <div
        className={cn(
          "border-b border-border px-4 py-3 dark:border-zinc-700",
          criticas > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-zinc-50 dark:bg-zinc-800",
        )}
      >
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            criticas > 0 ? "text-red-600 dark:text-red-400" : "text-celeste-trifinio",
          )}
        >
          Alertas de bitácoras
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {total > 0
            ? `${total} aviso${total === 1 ? "" : "s"} · ${criticas} crítico${criticas === 1 ? "" : "s"}`
            : "Sin alertas en los viajes registrados"}
        </p>
      </div>

      {alertas.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <GvMorphIcon icon={Bell} hoverIcon={BellRing} size={32} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Todo al día</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No hay viajes con datos incompletos ni pendientes de revisión.
          </p>
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
                    ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                )}
              >
                {alerta.severidad === "error" ? (
                  <AlertTriangle className="size-4 shrink-0" />
                ) : alerta.titulo.includes("combustible") ? (
                  <GvMorphIcon icon={Fuel} hoverIcon={CircleAlert} size={16} />
                ) : (
                  <GvMorphIcon icon={FileQuestion} hoverIcon={CircleAlert} size={16} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground">
                    {alerta.bitacora.ter_vehiculos?.placa ?? "Vehículo"}
                  </p>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      alerta.severidad === "error"
                        ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                    )}
                  >
                    {alerta.severidad === "error" ? "Crítico" : "Medio"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground">{alerta.titulo}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{alerta.detalle}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatFechaHoraGv(alerta.bitacora.fecha)}
                </p>
              </div>
            </GvNotificacionItem>
          ))}
        </ul>
      )}
    </GvNotificacionesCampana>
  );
}
