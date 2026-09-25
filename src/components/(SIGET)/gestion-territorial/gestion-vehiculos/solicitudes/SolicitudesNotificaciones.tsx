"use client";

import { useMemo, useState } from "react";
import { Bell, BellRing, CalendarClock, Clock } from "lucide";
import { AlertTriangle, Play } from "lucide-react";
import { GvMorphIcon } from "../lib/morph-icon";
import { GvNotificacionItem, GvNotificacionesCampana } from "../lib/gv-notificaciones-ui";
import { useGvNotificacionesVistas } from "../lib/gv-notificaciones-vistas";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import { cn } from "@/lib/utils";
import {
  solicitudMisionAprobadaSinIniciarVencida,
  solicitudPendienteVencida,
} from "./lib/helpers";
import { type SolicitudRow } from "./lib/zod";

type SolicitudesNotificacionesProps = {
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
          Salida programada: {formatFechaHoraGv(solicitud.fecha_inicio)}
        </p>
      </div>
    </GvNotificacionItem>
  );
}

export function SolicitudesNotificaciones({
  solicitudes,
  variant,
  userId,
  onAbrirSolicitud,
}: SolicitudesNotificacionesProps) {
  const [open, setOpen] = useState(false);

  const pendientes = useMemo(() => {
    if (variant !== "gestion") return [];
    return solicitudes.filter((sol) => sol.estado === "PENDIENTE");
  }, [solicitudes, variant]);

  const misionesSinIniciarVencidas = useMemo(() => {
    const base = solicitudes.filter(solicitudMisionAprobadaSinIniciarVencida);
    if (variant === "usuario") {
      return base.filter((sol) => filtroUsuario(sol, userId));
    }
    return base;
  }, [solicitudes, variant, userId]);

  const total = pendientes.length + misionesSinIniciarVencidas.length;
  const totalVencidas =
    pendientes.filter(solicitudPendienteVencida).length + misionesSinIniciarVencidas.length;
  const hayCriticas = totalVencidas > 0;

  const alertKey = useMemo(
    () =>
      [
        ...pendientes.map((s) => `p:${s.id}`),
        ...misionesSinIniciarVencidas.map((s) => `m:${s.id}`),
      ].join("|"),
    [pendientes, misionesSinIniciarVencidas],
  );

  const { showBadge, markSeen } = useGvNotificacionesVistas(alertKey, total);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) markSeen();
  };

  const abrirSolicitud = (id: string) => {
    onAbrirSolicitud?.(id);
    setOpen(false);
  };

  const tituloCampana =
    variant === "gestion" ? "Solicitudes y misiones" : "Sus misiones";

  return (
    <GvNotificacionesCampana
      open={open}
      onOpenChange={handleOpenChange}
      showBadge={showBadge}
      badgeCount={total}
      badgeTone={hayCriticas ? "critical" : total > 0 ? "warn" : "warn"}
      ariaLabel={`${tituloCampana}${total > 0 ? `, ${total} avisos` : ""}`}
    >
      <div
        className={cn(
          "border-b border-border px-4 py-3 dark:border-zinc-700",
          hayCriticas ? "bg-red-50 dark:bg-red-950/30" : "bg-zinc-50 dark:bg-zinc-800",
        )}
      >
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            hayCriticas ? "text-red-600 dark:text-red-400" : "text-celeste-trifinio",
          )}
        >
          {tituloCampana}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {total > 0
            ? variant === "gestion"
              ? `${pendientes.length} pendiente${pendientes.length === 1 ? "" : "s"} · ${misionesSinIniciarVencidas.length} misión${misionesSinIniciarVencidas.length === 1 ? "" : "es"} sin iniciar`
              : `${total} misión${total === 1 ? "" : "es"} aprobada${total === 1 ? "" : "s"} pendiente${total === 1 ? "" : "s"} de inicio`
            : variant === "gestion"
              ? "Sin solicitudes pendientes ni misiones atrasadas"
              : "No tiene misiones aprobadas pendientes de inicio"}
        </p>
      </div>

      {total === 0 ? (
        <div className="px-4 py-8 text-center">
          <GvMorphIcon icon={Bell} hoverIcon={BellRing} size={32} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Todo al día</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {variant === "gestion"
              ? "No hay solicitudes por revisar ni misiones sin iniciar."
              : "Cuando tenga una misión aprobada, la verá aquí si pasa la hora de salida."}
          </p>
        </div>
      ) : (
        <ul className="max-h-80 overflow-y-auto py-1">
          {variant === "gestion" && pendientes.length > 0 ? (
            <>
              <li className="px-4 py-2">
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
                  onAbrir={onAbrirSolicitud ? abrirSolicitud : undefined}
                />
              ))}
            </>
          ) : null}

          {misionesSinIniciarVencidas.length > 0 ? (
            <>
              <li className="px-4 py-2">
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
                  onAbrir={onAbrirSolicitud ? abrirSolicitud : undefined}
                />
              ))}
            </>
          ) : null}
        </ul>
      )}
    </GvNotificacionesCampana>
  );
}
