"use client";

import { useState } from "react";
import { AlertTriangle, Bell, BellRing, CalendarClock, Clock } from "lucide";
import { GvMorphIcon } from "../lib/morph-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatFechaHoraTablaCompactGt } from "@/lib/fechas-gt";
import { cn } from "@/lib/utils";
import { solicitudPendienteVencida } from "./lib/helpers";
import { type SolicitudRow } from "./lib/zod";

export function SolicitudesNotificaciones({
  solicitudes,
  onSelectSolicitud,
}: {
  solicitudes: SolicitudRow[];
  onSelectSolicitud?: (solicitud: SolicitudRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const pendientes = solicitudes.filter((sol) => sol.estado === "PENDIENTE");
  const vencidas = pendientes.filter(solicitudPendienteVencida);
  const total = pendientes.length;
  const totalVencidas = vencidas.length;
  const hayVencidas = totalVencidas > 0;

  const handleSelect = (solicitud: SolicitudRow) => {
    onSelectSolicitud?.(solicitud);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          aria-label={`Solicitudes pendientes${total > 0 ? `, ${total}` : ""}${hayVencidas ? `, ${totalVencidas} vencidas` : ""}`}
        >
          <GvMorphIcon icon={Bell} hoverIcon={BellRing} size={20} />
          {total > 0 ? (
            <span
              className={cn(
                "absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full px-1 py-0.5 text-[9px] font-black text-white",
                hayVencidas ? "bg-red-600" : "bg-amber-500",
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
            <p className="mt-1 text-xs text-muted-foreground">
              No hay solicitudes esperando aprobación.
            </p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {pendientes.map((solicitud) => {
              const vencida = solicitudPendienteVencida(solicitud);

              return (
                <li key={solicitud.id} className="border-b border-border last:border-0 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleSelect(solicitud)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors",
                      vencida
                        ? "hover:bg-red-50/80 dark:hover:bg-red-950/25"
                        : "hover:bg-sky-50/80 dark:hover:bg-sky-950/25",
                    )}
                  >
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
                          vencida
                            ? "font-semibold text-red-600 dark:text-red-400"
                            : "text-muted-foreground",
                        )}
                      >
                        Salida: {formatFechaHoraTablaCompactGt(solicitud.fecha_inicio)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
