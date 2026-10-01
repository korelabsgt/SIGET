"use client";

import { CircleAlert, Wrench } from "lucide";
import { AlertTriangle } from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { GvNotificacionItem, type GvNotificacionesSeccion } from "../lib/gv-notificaciones-ui";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import { cn } from "@/lib/utils";
import { formatEstadoFallaLabel, getMantenimientoAlerts } from "./lib/helpers";
import { type FallaRow } from "./lib/zod";

export function mantenimientoNotificacionesSeccion({
  fallas,
  onAbrirFalla,
}: {
  fallas: FallaRow[];
  onAbrirFalla?: (falla: FallaRow) => void;
}): GvNotificacionesSeccion {
  const alertas = getMantenimientoAlerts(fallas);
  const total = alertas.length;
  const criticas = alertas.filter((a) => a.severidad === "error").length;
  const alertKey = alertas.map((alerta) => alerta.id).sort().join("|");

  const content =
    total === 0
      ? null
      : (
          <>
            <li className="border-t border-border px-4 py-2 first:border-t-0 dark:border-zinc-800">
              <p className="text-[9px] font-bold uppercase tracking-widest text-celeste-trifinio">
                Alertas de mantenimiento
              </p>
            </li>
            {alertas.map((alerta) => (
              <GvNotificacionItem
                key={alerta.id}
                tone={alerta.severidad === "error" ? "critical" : "warn"}
                onClick={onAbrirFalla ? () => onAbrirFalla(alerta.falla) : undefined}
                ariaLabel={
                  onAbrirFalla
                    ? `Atender avería ${alerta.falla.vehiculo?.placa ?? ""}: ${alerta.titulo}`
                    : undefined
                }
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
                  ) : (
                    <GvMorphIcon icon={Wrench} hoverIcon={CircleAlert} size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-foreground">
                      {alerta.falla.vehiculo?.placa ?? "Vehículo"}
                    </p>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        alerta.severidad === "error"
                          ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                      )}
                    >
                      {alerta.severidad === "error" ? "Alta" : formatEstadoFallaLabel(alerta.falla.estado)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{alerta.titulo}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{alerta.detalle}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatFechaHoraGv(alerta.falla.created_at)}
                  </p>
                </div>
              </GvNotificacionItem>
            ))}
          </>
        );

  return { total, criticas, key: alertKey, content };
}
