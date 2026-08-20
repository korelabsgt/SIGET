"use client";

import { Bell, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFleetAllAlerts } from "./lib/helpers";
import { type VehiculoRow } from "./lib/zod";
import { cn } from "@/lib/utils";

export function FlotaNotificaciones({ vehiculos }: { vehiculos: VehiculoRow[] }) {
  const alertas = getFleetAllAlerts(vehiculos);
  const total = alertas.length;
  const criticas = alertas.filter((a) => a.severidad === "error").length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          aria-label={`Alertas de flota${total > 0 ? `, ${total} pendientes` : ""}`}
        >
          <Bell className="size-5" />
          {total > 0 ? (
            <span
              className={cn(
                "absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full px-1 py-0.5 text-[9px] font-black text-white",
                criticas > 0 ? "bg-red-600" : "bg-amber-500",
              )}
            >
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[200] w-[min(100vw-2rem,24rem)] border border-border bg-white p-0 opacity-100 shadow-lg dark:bg-zinc-900"
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
            <Bell className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">Todo al día</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No hay alertas de documentos ni mantenimiento.
            </p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {alertas.map((alerta) => (
              <li
                key={alerta.id}
                className="border-b border-border px-4 py-3 last:border-0 dark:border-zinc-800"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      alerta.severidad === "error"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                    )}
                  >
                    <AlertTriangle className="size-4" />
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
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {alerta.detalle}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
