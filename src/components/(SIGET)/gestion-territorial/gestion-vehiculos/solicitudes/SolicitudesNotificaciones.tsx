"use client";

import { CalendarClock, Clock } from "lucide";
import { AlertTriangle, Play } from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { GvNotificacionItem, type GvNotificacionesSeccion } from "../lib/gv-notificaciones-ui";
import { textoSalidaMision } from "./lib/helpers";
import { cn } from "@/lib/utils";
import {
  solicitudMisionAprobadaSinIniciarVencida,
  solicitudPendienteVencida,
} from "./lib/helpers";
import { type SolicitudRow } from "./lib/zod";

export type SolicitudesNotificacionesProps = {
  solicitudes: SolicitudRow[];
  variant: "gestion" | "usuario";
  userId?: string | null;
  onAbrirSolicitud?: (solicitudId: string) => void;
};

function filtroUsuario(
  solicitud: SolicitudRow,
  userId: string | null | undefined,
): boolean {
  if (!userId) return false;
  return solicitud.solicitante_id === userId;
}

function SolicitudNotificacionFila({
  solicitud,
  vencida,
  tipo,
  onAbrir,
}: {
  solicitud: SolicitudRow;
  vencida: boolean;
  tipo: "pendiente" | "mision";
  onAbrir?: (id: string) => void;
}) {
  const titulo =
    tipo === "pendiente"
      ? solicitud.solicitante?.nombre || "Solicitante"
      : "Misión sin iniciar";

  return (
    <GvNotificacionItem
      tone={vencida ? "critical" : "warn"}
      onClick={onAbrir ? () => onAbrir(solicitud.id) : undefined}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          vencida
            ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
            : tipo === "mision"
              ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
        )}
      >
        {tipo === "mision" ? (
          <Play className="size-4 shrink-0" />
        ) : vencida ? (
          <AlertTriangle className="size-4 shrink-0" />
        ) : (
          <GvMorphIcon icon={CalendarClock} hoverIcon={Clock} size={16} />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground">
            {titulo}
          </p>
          {vencida ? (
            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-950 dark:text-red-400">
              {tipo === "mision" ? "Sin iniciar" : "Vencida"}
            </span>
          ) : null}
        </div>
        <p className="text-xs font-semibold text-foreground">{solicitud.destino}</p>
        {tipo === "mision" && solicitud.solicitante?.nombre ? (
          <p className="text-xs text-muted-foreground">
            {solicitud.solicitante.nombre}
          </p>
        ) : null}
        <p
          className={cn(
            "mt-0.5 text-xs",
            vencida ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground",
          )}
        >
          Salida programada: {textoSalidaMision(solicitud)}
        </p>
      </div>
    </GvNotificacionItem>
  );
}

export function solicitudesNotificacionesSeccion({
  solicitudes,
  variant,
  userId,
  onAbrirSolicitud,
}: SolicitudesNotificacionesProps): GvNotificacionesSeccion {
  const pendientes =
    variant !== "gestion" ? [] : solicitudes.filter((sol) => sol.estado === "PENDIENTE");

  const misionesBase = solicitudes.filter(solicitudMisionAprobadaSinIniciarVencida);
  const misionesSinIniciarVencidas =
    variant === "usuario"
      ? misionesBase.filter((sol) => filtroUsuario(sol, userId))
      : misionesBase;

  const total = pendientes.length + misionesSinIniciarVencidas.length;
  const totalVencidas =
    pendientes.filter(solicitudPendienteVencida).length + misionesSinIniciarVencidas.length;

  const alertKey = [
    ...pendientes.map((s) => `p:${s.id}`),
    ...misionesSinIniciarVencidas.map((s) => `m:${s.id}`),
  ].join("|");

  const tituloCampana =
    variant === "gestion" ? "Solicitudes y misiones" : "Sus misiones";

  const content =
    total === 0
      ? null
      : (
          <>
            <li className="border-t border-border px-4 py-2 first:border-t-0 dark:border-zinc-800">
              <p className="text-[9px] font-bold uppercase tracking-widest text-celeste-trifinio">
                {tituloCampana}
              </p>
            </li>
            {variant === "gestion" && pendientes.length > 0 ? (
              <>
                <li className="px-4 py-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Por aprobar o rechazar
                  </p>
                </li>
                {pendientes.map((solicitud) => (
                  <SolicitudNotificacionFila
                    key={`p-${solicitud.id}`}
                    solicitud={solicitud}
                    vencida={solicitudPendienteVencida(solicitud)}
                    tipo="pendiente"
                    onAbrir={onAbrirSolicitud}
                  />
                ))}
              </>
            ) : null}
            {misionesSinIniciarVencidas.length > 0 ? (
              <>
                <li className="px-4 py-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {variant === "gestion"
                      ? "Misiones aprobadas sin iniciar (hora de salida pasada)"
                      : "Inicie su misión"}
                  </p>
                </li>
                {misionesSinIniciarVencidas.map((solicitud) => (
                  <SolicitudNotificacionFila
                    key={`m-${solicitud.id}`}
                    solicitud={solicitud}
                    vencida
                    tipo="mision"
                    onAbrir={onAbrirSolicitud}
                  />
                ))}
              </>
            ) : null}
          </>
        );

  return {
    total,
    criticas: totalVencidas,
    key: alertKey,
    content,
  };
}
