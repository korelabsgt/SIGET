"use client";

import { useMemo, useState } from "react";
import { MantenimientoPanel } from "./MantenimientoPanel";
import { MantenimientoNotificaciones } from "./MantenimientoNotificaciones";
import { MantenimientoStatsCards } from "./MantenimientoStatsCards";
import { Crear } from "./forms/Crear";
import { Loader2 } from "lucide-react";
import { differenceInDays } from "date-fns";
import { toast } from "react-toastify";
import { useFallasMantenimiento, useMecanicos } from "./lib/hooks";
import { GestionVehiculosTableShell, GvTableKpiSlot, GV_TABLE_BODY_CENTER_CLASS, gvTableShellVisibleRows } from "../lib/table-ui";
import { GV_TABLE_TOOLBAR_ACTIONS_CLASS, GV_TABLE_TOOLBAR_PRIMARY_CLASS, GV_TABLE_TOOLBAR_ROW_CLASS } from "../lib/gv-header-ui";
import { useGvPanelChrome, GvHeaderExtras } from "../lib/gv-page-chrome";
import { GvTableSectionMotion } from "../lib/gv-table-motion";
import { GvExportReporteButton } from "../lib/gv-export-ui";
import { GvMonthPicker } from "../lib/gv-month-picker";
import { GvTabFilter } from "../lib/gv-tab-filter";
import { filtrarFallasMantenimiento } from "./lib/helpers";
import { registroEnPeriodoCalendario } from "../lib/periodo-filtro";
import { useGvTablePagination } from "../lib/table-pagination";
import { mesCalendarioGt } from "@/lib/fechas-gt";
import { useGvPermissionRole } from "../lib/gv-permissions-hook";
import {
  canExportMantenimientoReporte,
  canGestionarFallasMantenimiento,
  canManageMantenimiento,
} from "../lib/permissions";
import { type FallaRow } from "./lib/zod";

const TABS = ["ACTIVAS", "CRITICAS", "SOLVENTADAS"] as const;
type TabMantenimiento = (typeof TABS)[number];

const TAB_LABELS: Record<TabMantenimiento, string> = {
  ACTIVAS: "Taller",
  CRITICAS: "Alta",
  SOLVENTADAS: "Solventadas",
};

export function Mantenimiento() {
  const gvRole = useGvPermissionRole();
  const canManage = canManageMantenimiento(gvRole);
  const canExport = canExportMantenimientoReporte(gvRole);
  const canGestionar = canGestionarFallasMantenimiento(gvRole);
  const { data: fallas = [], isLoading } = useFallasMantenimiento();
  const { data: mecanicos = [] } = useMecanicos();
  const [tabActiva, setTabActiva] = useState<TabMantenimiento>("ACTIVAS");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);
  const [isExporting, setIsExporting] = useState(false);
  const [detailFalla, setDetailFalla] = useState<FallaRow | null>(null);

  const fallasDelPeriodo = useMemo(
    () => fallas.filter((f) => registroEnPeriodoCalendario(f.created_at, periodoFilter)),
    [fallas, periodoFilter],
  );

  const fallasActivas = fallasDelPeriodo.filter((f) => f.estado !== "SOLVENTADA").length;

  const unidadesFueraDeServicio = new Set(
    fallasDelPeriodo
      .filter((f) => f.estado !== "SOLVENTADA" && (f.severidad === "ALTA" || f.estado === "EN_REPARACION"))
      .map((f) => f.vehiculo_id)
  ).size;

  const fallasSolventadas = fallasDelPeriodo.filter((f) => f.estado === "SOLVENTADA" && f.solventado_at);
  const totalDays = fallasSolventadas.reduce((acc, f) => {
    return acc + differenceInDays(new Date(f.solventado_at!), new Date(f.created_at));
  }, 0);
  const promedioDias = fallasSolventadas.length > 0
    ? Math.round((totalDays / fallasSolventadas.length) * 10) / 10
    : 0;

  const fallasFiltradas = filtrarFallasMantenimiento(
    fallasDelPeriodo,
    canManage ? tabActiva : "ACTIVAS",
  );
  const paginacionKey = `${canManage ? tabActiva : "ACTIVAS"}|${periodoFilter}`;
  const {
    pageItems: fallasPaginadas,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(fallasFiltradas, paginacionKey);

  const tableVisibleRows = gvTableShellVisibleRows(pageSize);

  useGvPanelChrome("mantenimiento");

  const handleExportReporte = async () => {
    if (fallasDelPeriodo.length === 0) {
      toast.warning("No hay averías para exportar en el periodo seleccionado.");
      return;
    }

    setIsExporting(true);
    try {
      const { exportAveriasReporte } = await import("./lib/averias-excel");
      const result = await exportAveriasReporte(fallasDelPeriodo);

      if (result.ok) {
        toast.success("Reporte exportado exitosamente");
        return;
      }

      if (result.reason === "no_data") {
        toast.warning("No hay registros para exportar.");
        return;
      }

      toast.error("Hubo un problema al exportar el reporte.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <GvHeaderExtras panelId="mantenimiento">
        {!isLoading ? <MantenimientoNotificaciones fallas={fallas} /> : null}
      </GvHeaderExtras>
      <GvTableSectionMotion panelId="mantenimiento">
      <GestionVehiculosTableShell
        visibleRows={tableVisibleRows}
        kpiSlot={
          canManage ? (
            <GvTableKpiSlot>
              <MantenimientoStatsCards
                metrics={{
                  fallasActivas,
                  unidadesFueraDeServicio,
                  promedioDias,
                }}
              />
            </GvTableKpiSlot>
          ) : undefined
        }
        toolbar={
            <div className={GV_TABLE_TOOLBAR_ROW_CLASS}>
              <div className={GV_TABLE_TOOLBAR_PRIMARY_CLASS}>
                {canManage ? (
                  <GvTabFilter
                    value={tabActiva}
                    onChange={setTabActiva}
                    layoutId="gv-mantenimiento-tabs"
                    layout="responsive-grid"
                    fill
                    compact
                    className="min-w-0 w-full flex-1 lg:w-auto"
                    options={TABS.map((tab) => ({
                      value: tab,
                      label: TAB_LABELS[tab],
                      tone: tab === "CRITICAS" ? "danger" : "default",
                    }))}
                  />
                ) : null}

                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="!h-11 min-w-0 w-full text-xs lg:hidden sm:w-[10.5rem]"
                />
              </div>

              <div className={GV_TABLE_TOOLBAR_ACTIONS_CLASS}>
                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="hidden lg:inline-flex"
                />
                {canExport ? (
                  <GvExportReporteButton
                    onClick={handleExportReporte}
                    disabled={isLoading || fallasDelPeriodo.length === 0}
                    loading={isExporting}
                  />
                ) : null}
                <Crear />
              </div>
            </div>
          }
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
        >
          {isLoading ? (
            <div className={GV_TABLE_BODY_CENTER_CLASS}>
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          ) : (
            <MantenimientoPanel
              fallas={fallasPaginadas}
              catalogo={fallasFiltradas}
              mecanicos={mecanicos}
              isAuthorized={canGestionar}
              detail={detailFalla}
              onDetailChange={setDetailFalla}
            />
          )}
        </GestionVehiculosTableShell>
      </GvTableSectionMotion>
    </>
  );
}
