"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { SolicitudesPanel } from "./SolicitudesPanel";
import { SolicitudesNotificaciones } from "./SolicitudesNotificaciones";
import { Crear } from "./forms/Crear";
import { SolicitudActionModal } from "./SolicitudActionModal";
import { GestionVehiculosTableShell, gvTableShellVisibleRows } from "../lib/table-ui";
import { useGvTablePagination } from "../lib/table-pagination";
import { GvTabFilter } from "../lib/gv-tab-filter";

import { useInvalidateSolicitudes, useSolicitudes } from "./lib/hooks";
import { cambiarEstadoSolicitud } from "./lib/actions";
import { type SolicitudRow } from "./lib/zod";
import { GV_HEADER_OUTLINE_BUTTON_CLASS } from "../lib/gv-header-ui";
import { useGvPanelChrome } from "../lib/gv-page-chrome";
import { GvTableSectionMotion } from "../lib/gv-table-motion";
import { GvMonthPicker } from "../lib/gv-month-picker";
import { registroEnPeriodoCalendario } from "../lib/periodo-filtro";
import { mesCalendarioGt } from "@/lib/fechas-gt";
import { canAprobarRechazarSolicitudes } from "../lib/permissions";
import { useGvPermissionRole } from "../lib/gv-permissions-hook";
import { cn } from "@/lib/utils";

const TABS = ["TODAS", "PENDIENTES", "ACTIVAS", "HISTORIAL"] as const;
type TabSolicitud = (typeof TABS)[number];
type AccionSolicitud = "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR";

const TAB_LABELS: Record<TabSolicitud, string> = {
  TODAS: "Todas",
  PENDIENTES: "Pendientes",
  ACTIVAS: "Activas",
  HISTORIAL: "Historial",
};

export function Solicitudes() {
  const { data: solicitudes = [], isLoading: loading } = useSolicitudes();
  const invalidate = useInvalidateSolicitudes();
  const gvRole = useGvPermissionRole();
  const canAprobarRechazar = canAprobarRechazarSolicitudes(gvRole);
  const [tabActiva, setTabActiva] = useState<TabSolicitud>("TODAS");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);

  const [formOpen, setFormOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudRow | null>(null);
  const [actionType, setActionType] = useState<"APROBAR" | "RECHAZAR" | null>(null);
  const [misionPendiente, setMisionPendiente] = useState(false);
  const [detailSolicitud, setDetailSolicitud] = useState<SolicitudRow | null>(null);

  const handleAction = async (solicitud: SolicitudRow, action: AccionSolicitud) => {
    if (action === "INICIAR" || action === "FINALIZAR") {
      if (misionPendiente) return;
      setMisionPendiente(true);
      try {
        const nuevoEstado = action === "INICIAR" ? "EN_MISION" : "FINALIZADA";
        const res = await cambiarEstadoSolicitud(solicitud.id, nuevoEstado);
        if (!res.success) {
          toast.error(res.error || "No se pudo actualizar la misión.");
          return;
        }
        toast.success(action === "INICIAR" ? "Misión iniciada." : "Misión finalizada.");
        invalidate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo actualizar la misión.");
      } finally {
        setMisionPendiente(false);
      }
      return;
    }

    setSelectedSolicitud(solicitud);
    setActionType(action);
    setActionModalOpen(true);
  };

  const filtradas = useMemo(() => {
    return solicitudes.filter((sol) => {
      if (!registroEnPeriodoCalendario(sol.fecha_inicio, periodoFilter)) return false;
      if (tabActiva === "TODAS") return true;
      if (tabActiva === "PENDIENTES") return sol.estado === "PENDIENTE";
      if (tabActiva === "ACTIVAS") return sol.estado === "APROBADA" || sol.estado === "EN_MISION";
      if (tabActiva === "HISTORIAL") return sol.estado === "FINALIZADA" || sol.estado === "RECHAZADA";
      return true;
    });
  }, [solicitudes, periodoFilter, tabActiva]);

  const paginacionKey = `${tabActiva}|${periodoFilter}`;
  const {
    pageItems: solicitudesPaginadas,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(filtradas, paginacionKey);

  const tableVisibleRows = gvTableShellVisibleRows(pageSize);

  const headerExtras = useMemo(
    () =>
      canAprobarRechazar ? (
        <SolicitudesNotificaciones solicitudes={solicitudes} />
      ) : null,
    [canAprobarRechazar, solicitudes],
  );

  useGvPanelChrome("solicitudes", { headerExtras });

  return (
    <>
      <GvTableSectionMotion panelId="solicitudes">
        <GestionVehiculosTableShell
          visibleRows={tableVisibleRows}
          pagination={{
            pageSafe,
            totalPages,
            pageSize,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
          toolbar={
            <div className="flex flex-col gap-2 md:col-span-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full items-stretch gap-2 lg:contents">
                  <GvTabFilter
                    value={tabActiva}
                    onChange={setTabActiva}
                    layoutId="gv-solicitudes-tabs"
                    compact
                    options={TABS.map((tab) => ({
                      value: tab,
                      label: TAB_LABELS[tab],
                    }))}
                  />

                  <GvMonthPicker
                    value={periodoFilter}
                    onChange={setPeriodoFilter}
                    className="!h-11 min-w-0 flex-1 basis-0 !w-full text-xs lg:hidden"
                  />
                </div>

                <div
                  className={cn(
                    "grid w-full grid-cols-1 gap-2 lg:flex lg:flex-row lg:flex-nowrap lg:items-center lg:ml-auto lg:w-auto",
                    "[&_button]:w-full lg:[&_button]:w-auto lg:[&_button]:shrink-0",
                  )}
                >
                  <GvMonthPicker
                    value={periodoFilter}
                    onChange={setPeriodoFilter}
                    className="hidden lg:inline-flex"
                  />
                  <button
                    type="button"
                    onClick={() => setFormOpen(true)}
                    className={GV_HEADER_OUTLINE_BUTTON_CLASS}
                  >
                    <Plus className="size-4 shrink-0" />
                    <span className="lg:hidden">Nueva</span>
                    <span className="hidden lg:inline">Nueva solicitud</span>
                  </button>
                </div>
              </div>
          }
        >
          {loading ? (
            <div className="flex min-h-full items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          ) : (
            <SolicitudesPanel
              solicitudes={solicitudesPaginadas}
              catalogo={filtradas}
              onAction={handleAction}
              misionPendiente={misionPendiente}
              detail={detailSolicitud}
              onDetailChange={setDetailSolicitud}
            />
          )}
        </GestionVehiculosTableShell>
      </GvTableSectionMotion>

      <Crear open={formOpen} onOpenChange={setFormOpen} onSaved={invalidate} />

      <SolicitudActionModal
        open={actionModalOpen}
        onOpenChange={setActionModalOpen}
        solicitud={selectedSolicitud}
        actionType={actionType}
        onSaved={invalidate}
      />
    </>
  );
}
