"use client";

import { useMemo, useState } from "react";
import { Bell, BellRing } from "lucide";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { GvMorphIcon } from "./morph-icon";
import { GvNotificacionesCampana } from "./gv-notificaciones-ui";
import { useGvNotificacionesVistas } from "./gv-notificaciones-vistas";
import { useGvPermissionRole } from "./gv-permissions-hook";
import { canViewGvCampanaNotificaciones } from "./permissions";
import { useGvSolicitudDetailIntent } from "./gv-solicitud-detail-intent";
import { useGvPanelActionIntent } from "./gv-panel-action-intent";
import { useSolicitudes } from "../solicitudes/lib/hooks";
import { solicitudesNotificacionesSeccion } from "../solicitudes/SolicitudesNotificaciones";
import { useVehiculos } from "../flota/lib/hooks";
import { flotaNotificacionesSeccion } from "../flota/FlotaNotificaciones";
import { useFallasMantenimiento } from "../mantenimiento/lib/hooks";
import { mantenimientoNotificacionesSeccion } from "../mantenimiento/MantenimientoNotificaciones";
import { useBitacoras } from "../bitacoras/lib/hooks";
import { bitacorasNotificacionesSeccion } from "../bitacoras/BitacorasNotificaciones";
import { cn } from "@/lib/utils";
import { useGvSection, type GvSubmoduloId } from "./tab-context";
import type { GvNotificacionesSeccion } from "./gv-notificaciones-ui";

const SECCION_VACIA: GvNotificacionesSeccion = {
  total: 0,
  criticas: 0,
  key: "",
  content: null,
};

function metaCampanaVista(
  section: GvSubmoduloId,
  puedeVerGestion: boolean,
): { titulo: string; ariaBase: string; vacio: string } {
  switch (section) {
    case "solicitudes":
      return {
        titulo: puedeVerGestion ? "Solicitudes y misiones" : "Sus misiones",
        ariaBase: puedeVerGestion ? "Solicitudes y misiones" : "Sus misiones",
        vacio: puedeVerGestion
          ? "No hay solicitudes por revisar ni misiones sin iniciar."
          : "No tiene misiones aprobadas pendientes de inicio.",
      };
    case "flota":
      return {
        titulo: "Alertas de flota",
        ariaBase: "Alertas de flota",
        vacio: "No hay alertas de documentos, mantenimiento ni servicio por km.",
      };
    case "bitacoras":
      return {
        titulo: "Alertas de bitácoras",
        ariaBase: "Alertas de bitácoras",
        vacio: "No hay bitácoras pendientes de confirmar ni otras alertas.",
      };
    case "mantenimiento":
      return {
        titulo: "Alertas de mantenimiento",
        ariaBase: "Alertas de mantenimiento",
        vacio: "No hay averías pendientes ni en reparación.",
      };
  }
}

export function GvCampanaNotificaciones() {
  const [open, setOpen] = useState(false);
  const section = useGvSection()?.section ?? "flota";
  const { data: solicitudes = [], isLoading: loadingSolicitudes } = useSolicitudes();
  const { data: vehiculos = [], isLoading: loadingVehiculos } = useVehiculos();
  const { data: fallas = [], isLoading: loadingFallas } = useFallasMantenimiento();
  const { data: bitacoras = [], isLoading: loadingBitacoras } = useBitacoras();
  const gvRole = useGvPermissionRole();
  const { user } = useUserContext();
  const puedeVerGestion = canViewGvCampanaNotificaciones(gvRole);
  const solicitudIntent = useGvSolicitudDetailIntent();
  const panelIntent = useGvPanelActionIntent();
  const vista = metaCampanaVista(section, puedeVerGestion);

  const fallasServicioKm = useMemo(
    () =>
      fallas.map((falla) => ({
        vehiculo_id: falla.vehiculo_id,
        descripcion: falla.descripcion,
        estado: falla.estado,
      })),
    [fallas],
  );

  const solicitudesSeccion = solicitudesNotificacionesSeccion({
    solicitudes,
    variant: puedeVerGestion ? "gestion" : "usuario",
    userId: user?.id,
    onAbrirSolicitud: (id) => solicitudIntent?.openSolicitudDetail(id),
  });

  const flotaSeccion = puedeVerGestion
    ? flotaNotificacionesSeccion({
        vehiculos,
        fallasServicioKm,
        onAbrirVehiculo: (vehiculoId) => panelIntent?.openFlotaVehiculo(vehiculoId),
      })
    : { total: 0, criticas: 0, key: "", content: null };

  const mantenimientoSeccion = puedeVerGestion
    ? mantenimientoNotificacionesSeccion({
        fallas,
        onAbrirFalla: (falla) => {
          if (falla.id) panelIntent?.openMantenimientoFalla(falla.id);
        },
      })
    : { total: 0, criticas: 0, key: "", content: null };

  const bitacorasSeccion = bitacorasNotificacionesSeccion({
    bitacoras,
    onAbrirPendiente: (bitacora) => {
      panelIntent?.openBitacoraPendiente(bitacora.id);
    },
  });

  const activa: GvNotificacionesSeccion = (() => {
    switch (section) {
      case "solicitudes":
        return solicitudesSeccion;
      case "flota":
        return puedeVerGestion ? flotaSeccion : SECCION_VACIA;
      case "bitacoras":
        return bitacorasSeccion;
      case "mantenimiento":
        return puedeVerGestion ? mantenimientoSeccion : SECCION_VACIA;
      default:
        return SECCION_VACIA;
    }
  })();

  const total = activa.total;
  const criticas = activa.criticas;
  const alertKey = `${section}|${activa.key}`;

  const { showBadge, markSeen } = useGvNotificacionesVistas(alertKey, total);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) markSeen();
  };

  const loading =
    (section === "solicitudes" && loadingSolicitudes) ||
    (section === "flota" && loadingVehiculos) ||
    (section === "bitacoras" && loadingBitacoras) ||
    (section === "mantenimiento" && loadingFallas);

  if (loading) return null;

  const ariaLabel = `${vista.ariaBase}${total > 0 ? `, ${total} avisos` : ""}`;

  return (
    <GvNotificacionesCampana
      open={open}
      onOpenChange={handleOpenChange}
      showBadge={showBadge}
      badgeCount={total}
      badgeTone={criticas > 0 ? "critical" : "warn"}
      ariaLabel={ariaLabel}
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
          {vista.titulo}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {total > 0
            ? `${total} aviso${total === 1 ? "" : "s"}${criticas > 0 ? ` · ${criticas} crítico${criticas === 1 ? "" : "s"}` : ""}`
            : "Sin avisos en esta vista"}
        </p>
      </div>

      {total === 0 ? (
        <div className="px-4 py-8 text-center">
          <GvMorphIcon icon={Bell} hoverIcon={BellRing} size={32} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Todo al día</p>
          <p className="mt-1 text-xs text-muted-foreground">{vista.vacio}</p>
        </div>
      ) : (
        <ul className="max-h-96 overflow-y-auto py-1">{activa.content}</ul>
      )}
    </GvNotificacionesCampana>
  );
}
