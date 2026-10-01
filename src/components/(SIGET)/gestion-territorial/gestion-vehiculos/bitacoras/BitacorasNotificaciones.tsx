"use client";

import { CircleAlert, FileQuestion, Fuel } from "lucide";
import { AlertTriangle } from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { GvNotificacionItem, type GvNotificacionesSeccion } from "../lib/gv-notificaciones-ui";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import { cn } from "@/lib/utils";
import { getBitacoraAlerts } from "./lib/helpers";
import { type BitacoraRow } from "./lib/zod";

export function bitacorasNotificacionesSeccion({
  bitacoras,
}: {
  bitacoras: BitacoraRow[];
}): GvNotificacionesSeccion {
  const alertas = getBitacoraAlerts(bitacoras);
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
                Alertas de bitácoras
              </p>
            </li>
            {alertas.map((alerta) => (
              <GvNotificacionItem key={alerta.id} tone={alerta.severidad === "error" ? "critical" : "warn"}>
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
                      {alerta.bitacora.ot_vehiculos?.placa ?? "Vehículo"}
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
          </>
        );

  return { total, criticas, key: alertKey, content };
}
