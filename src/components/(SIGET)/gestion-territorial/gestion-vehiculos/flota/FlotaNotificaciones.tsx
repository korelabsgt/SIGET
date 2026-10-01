"use client";

import { AlertTriangle, CircleAlert } from "lucide";
import { GvMorphIcon } from "../lib/morph-icon";
import { GvNotificacionItem, type GvNotificacionesSeccion } from "../lib/gv-notificaciones-ui";
import { getFleetAllAlerts } from "./lib/helpers";
import { type VehiculoRow } from "./lib/zod";
import { cn } from "@/lib/utils";

type FallaServicioKm = {
  vehiculo_id: string;
  descripcion: string;
  estado: string;
};

export function flotaNotificacionesSeccion({
  vehiculos,
  fallasServicioKm,
  onAbrirVehiculo,
}: {
  vehiculos: VehiculoRow[];
  fallasServicioKm: FallaServicioKm[];
  onAbrirVehiculo?: (vehiculoId: string) => void;
}): GvNotificacionesSeccion {
  const alertas = getFleetAllAlerts(vehiculos, fallasServicioKm);
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
                Alertas de flota
              </p>
            </li>
            {alertas.map((alerta) => (
              <GvNotificacionItem
                key={alerta.id}
                tone={alerta.severidad === "error" ? "critical" : "warn"}
                onClick={
                  onAbrirVehiculo ? () => onAbrirVehiculo(alerta.vehiculo_id) : undefined
                }
                ariaLabel={
                  onAbrirVehiculo
                    ? `Editar vehículo ${alerta.placa}: ${alerta.titulo}`
                    : undefined
                }
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
          </>
        );

  return { total, criticas, key: alertKey, content };
}
