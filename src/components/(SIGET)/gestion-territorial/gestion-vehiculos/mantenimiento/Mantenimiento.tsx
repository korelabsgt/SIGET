"use client";

import { useMemo, useState } from "react";
import { MantenimientoPanel } from "./MantenimientoPanel";
import { MantenimientoNotificaciones } from "./MantenimientoNotificaciones";
import { MantenimientoStatsCards } from "./MantenimientoStatsCards";
import { Crear } from "./forms/Crear";
import { Loader2 } from "lucide-react";
import { differenceInDays } from "date-fns";
import { toast } from "react-toastify";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useFallasMantenimiento, useMecanicos } from "./lib/hooks";
import { GestionVehiculosTableShell, gvTableVisibleRowCount } from "../lib/table-ui";
import { useGvLgUp } from "../lib/gv-breakpoint";
import { GV_PANEL_KPI_STACK_CLASS } from "../lib/page-shell";
import { cn } from "@/lib/utils";
import { useGvPanelChrome } from "../lib/gv-page-chrome";
import { GvTableSectionMotion } from "../lib/gv-table-motion";
import { useGvSection } from "../lib/tab-context";
import { GvExportReporteButton } from "../lib/gv-export-ui";
import { GvMonthPicker } from "../lib/gv-month-picker";
import { GvTabFilter } from "../lib/gv-tab-filter";
import { filtrarFallasMantenimiento } from "./lib/helpers";
import { registroEnPeriodoCalendario } from "../lib/periodo-filtro";
import { useGvTablePagination } from "../lib/table-pagination";
import { mesCalendarioGt } from "@/lib/fechas-gt";
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
  const { effectiveRole } = useUserContext();
  const canManage = canManageMantenimiento(effectiveRole);
  const canExport = canExportMantenimientoReporte(effectiveRole);
  const canGestionar = canGestionarFallasMantenimiento(effectiveRole);
  const { data: fallas = [], isLoading } = useFallasMantenimiento();
  const { data: mecanicos = [] } = useMecanicos();
  const [tabActiva, setTabActiva] = useState<TabMantenimiento>("ACTIVAS");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);
  const [isExporting, setIsExporting] = useState(false);
  const [detailFalla, setDetailFalla] = useState<FallaRow | null>(null);
  const gvSection = useGvSection();
  const panelActive = gvSection?.section === "mantenimiento";
  const lgUp = useGvLgUp();

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

  const tableVisibleRows = gvTableVisibleRowCount(
    fallasPaginadas.length,
    fallasFiltradas.length === 0,
  );

  const headerExtras = useMemo(
    () =>
      !isLoading ? (
        <MantenimientoNotificaciones fallas={fallas} />
      ) : null,
    [isLoading, fallas],
  );

  useGvPanelChrome("mantenimiento", { headerExtras });

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
    <div className={GV_PANEL_KPI_STACK_CLASS}>
      {panelActive && canManage ? (
        <MantenimientoStatsCards
          metrics={{
            fallasActivas,
            unidadesFueraDeServicio,
            promedioDias,
          }}
        />
      ) : null}

      <GvTableSectionMotion panelId="mantenimiento">
        <GestionVehiculosTableShell
          visibleRows={lgUp ? tableVisibleRows : null}
          toolbar={
            <div className="flex flex-col gap-2 md:col-span-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full items-stretch gap-2 lg:contents">
                  {canManage ? (
                    <GvTabFilter
                      value={tabActiva}
                      onChange={setTabActiva}
                      layoutId="gv-mantenimiento-tabs"
                      layout="responsive-grid"
                      fill
                      compact
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
                    className="!h-11 min-w-0 flex-1 basis-0 !w-full text-xs lg:hidden"
                  />
                </div>

                <div
                  className={cn(
                    "grid w-full gap-2 lg:flex lg:flex-row lg:flex-nowrap lg:items-center lg:ml-auto lg:w-auto",
                    canExport ? "grid-cols-2" : "grid-cols-1",
                    "[&_button]:w-full lg:[&_button]:w-auto lg:[&_button]:shrink-0",
                  )}
                >
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
            <div className="flex min-h-full items-center justify-center py-20">
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
    </div>
  );
}
