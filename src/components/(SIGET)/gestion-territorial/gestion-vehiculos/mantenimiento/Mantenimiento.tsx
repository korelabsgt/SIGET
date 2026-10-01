"use client";

import { useEffect, useMemo, useState } from "react";
import { MantenimientoPanel } from "./MantenimientoPanel";
import { MantenimientoStatsCards } from "./MantenimientoStatsCards";
import { Crear } from "./forms/Crear";
import { VerEditar } from "./forms/VerEditar";
import { Loader2, Wrench } from "lucide-react";
import { differenceInDays } from "date-fns";
import { toast } from "react-toastify";
import { useFallasMantenimiento, useMecanicos } from "./lib/hooks";
import { useVehiculos } from "../flota/lib/hooks";
import {
  GestionVehiculosTableEmpty,
  GestionVehiculosTableShell,
  GvTableKpiSlot,
  GV_TABLE_BODY_CENTER_CLASS,
  GV_TABLE_VIEWPORT_FILL,
} from "../lib/table-ui";
import {
  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
  GV_TABLE_TOOLBAR_ACTIONS_PAIR_CLASS,
  GV_TABLE_TOOLBAR_PRIMARY_CLASS,
  GV_TABLE_TOOLBAR_ROW_CLASS,
} from "../lib/gv-header-ui";
import {
  GV_TODOS_VEHICULOS,
  GvVehiculoFiltroSelect,
} from "../lib/gv-vehiculo-filtro-select";
import { useGvPanelChrome } from "../lib/gv-page-chrome";
import { useGvPanelActionIntent } from "../lib/gv-panel-action-intent";
import { GvTableSectionMotion } from "../lib/gv-table-motion";
import { GvExportReporteButton } from "../lib/gv-export-ui";
import { GvMonthPicker } from "../lib/gv-month-picker";
import { GvTabFilter } from "../lib/gv-tab-filter";
import {
  extractVehiculosVinculadosFallas,
  filtrarFallasMantenimiento,
  filtrarFallasPorVehiculo,
} from "./lib/helpers";
import { registroEnPeriodoCalendario } from "../lib/periodo-filtro";
import { useGvTablePagination } from "../lib/table-pagination";
import { mesCalendarioGt, normalizarMesCalendario } from "@/lib/fechas-gt";
import { cn } from "@/lib/utils";
import { useGvPermissionRole } from "../lib/gv-permissions-hook";
import {
  canExportMantenimientoReporte,
  canGestionarFallasMantenimiento,
  canManageMantenimiento,
  canViewAllFallasMantenimiento,
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
  const canViewAll = canViewAllFallasMantenimiento(gvRole);
  const panelIntent = useGvPanelActionIntent();
  const {
    data: fallas = [],
    isLoading,
    isError,
    error: fallasError,
  } = useFallasMantenimiento();
  const { data: mecanicos = [] } = useMecanicos();
  const { data: vehiculosFlota = [] } = useVehiculos();
  const [tabActiva, setTabActiva] = useState<TabMantenimiento>("ACTIVAS");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);
  const [vehiculoFilter, setVehiculoFilter] = useState(GV_TODOS_VEHICULOS);
  const [isExporting, setIsExporting] = useState(false);
  const [detailFalla, setDetailFalla] = useState<FallaRow | null>(null);
  const [fallaAccion, setFallaAccion] = useState<{
    falla: FallaRow;
    modo: "atender" | "solventar";
  } | null>(null);

  const vehiculosVinculados = useMemo(
    () => extractVehiculosVinculadosFallas(fallas),
    [fallas],
  );

  const vehiculosParaFiltro = canViewAll ? vehiculosFlota : vehiculosVinculados;

  const fallasDelPeriodo = useMemo(
    () =>
      fallas.filter((f) => {
        if (f.estado !== "SOLVENTADA") return true;
        return registroEnPeriodoCalendario(f.created_at, periodoFilter);
      }),
    [fallas, periodoFilter],
  );

  const fallasPorVehiculo = useMemo(
    () => filtrarFallasPorVehiculo(fallasDelPeriodo, vehiculoFilter, GV_TODOS_VEHICULOS),
    [fallasDelPeriodo, vehiculoFilter],
  );

  const fallasActivas = fallasPorVehiculo.filter((f) => f.estado !== "SOLVENTADA").length;

  const unidadesFueraDeServicio = new Set(
    fallasPorVehiculo
      .filter((f) => f.estado !== "SOLVENTADA" && (f.severidad === "ALTA" || f.estado === "EN_REPARACION"))
      .map((f) => f.vehiculo_id),
  ).size;

  const fallasSolventadas = fallasPorVehiculo.filter((f) => f.estado === "SOLVENTADA" && f.solventado_at);
  const totalDays = fallasSolventadas.reduce((acc, f) => {
    return acc + differenceInDays(new Date(f.solventado_at!), new Date(f.created_at));
  }, 0);
  const promedioDias = fallasSolventadas.length > 0
    ? Math.round((totalDays / fallasSolventadas.length) * 10) / 10
    : 0;

  const fallasFiltradas = filtrarFallasMantenimiento(fallasPorVehiculo, tabActiva);
  const paginacionKey = `${tabActiva}|${periodoFilter}|${vehiculoFilter}`;
  const {
    pageItems: fallasPaginadas,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(fallasFiltradas, paginacionKey);


  useGvPanelChrome("mantenimiento");

  const abrirFallaDesdeCampana = (falla: FallaRow) => {
    if (canGestionar) {
      setFallaAccion({
        falla,
        modo: falla.estado === "EN_REPARACION" ? "solventar" : "atender",
      });
      return;
    }
    setDetailFalla(falla);
  };

  useEffect(() => {
    const pendingId = panelIntent?.pendingMantenimientoFallaId;
    if (!pendingId || isLoading) return;
    const falla = fallas.find((f) => f.id === pendingId);
    if (!falla) return;
    abrirFallaDesdeCampana(falla);
    panelIntent?.clearPendingMantenimientoFalla();
  }, [
    isLoading,
    fallas,
    canGestionar,
    panelIntent?.pendingMantenimientoFallaId,
    panelIntent?.clearPendingMantenimientoFalla,
  ]);

  const handleExportReporte = async () => {
    const vehiculoId =
      vehiculoFilter === GV_TODOS_VEHICULOS ? "all" : vehiculoFilter;

    if (fallasPorVehiculo.length === 0) {
      toast.warning("No hay averías para exportar en el periodo seleccionado.");
      return;
    }

    setIsExporting(true);
    try {
      const { exportAveriasReporteVehiculo } = await import("./lib/averias-excel");
      const mesNorm = normalizarMesCalendario(periodoFilter) || mesCalendarioGt();
      const [anioNum, mesNum] = mesNorm.split("-").map(Number);
      const result = await exportAveriasReporteVehiculo({
        fallas: fallasPorVehiculo,
        vehiculoId,
        vehiculos: vehiculosFlota,
        mes: mesNum,
        anio: anioNum,
      });

      if (result.ok) {
        toast.success("Reporte exportado exitosamente");
        return;
      }

      if (result.reason === "no_data") {
        toast.warning(
          vehiculoId === "all"
            ? "No hay averías en el mes seleccionado."
            : "No hay averías del vehículo seleccionado en el mes seleccionado.",
        );
        return;
      }

      toast.error("Hubo un problema al exportar el reporte.");
    } finally {
      setIsExporting(false);
    }
  };

  const vehiculoFiltroTriggerClass = cn(
    canViewAll
      ? "w-full min-w-0 max-w-none lg:min-w-[12rem] lg:max-w-[min(26rem,32vw)]"
      : "w-full min-w-0 max-w-none lg:!w-auto lg:min-w-[8.75rem] lg:max-w-[10.5rem] shrink-0",
  );

  const vehiculoSelect = (
    <GvVehiculoFiltroSelect
      value={vehiculoFilter}
      onValueChange={setVehiculoFilter}
      vehiculos={vehiculosParaFiltro}
      canViewAll={canViewAll}
      triggerClassName={vehiculoFiltroTriggerClass}
      todosValue={GV_TODOS_VEHICULOS}
    />
  );

  return (
    <>
      <GvTableSectionMotion panelId="mantenimiento">
      <GestionVehiculosTableShell
        className="min-h-0 flex-1"
        visibleRows={GV_TABLE_VIEWPORT_FILL}
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

                <div className="w-full min-w-0 lg:hidden [&_[data-slot=select-trigger]]:w-full">
                  {vehiculoSelect}
                </div>

                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="!h-11 min-w-0 w-full text-sm sm:w-[10.5rem] lg:hidden"
                />
              </div>

              <div
                className={cn(
                  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
                  canExport ? GV_TABLE_TOOLBAR_ACTIONS_PAIR_CLASS : null,
                  "min-w-0 w-full shrink-0 flex-nowrap lg:flex-wrap",
                )}
              >
                <div className="hidden w-auto shrink-0 lg:block">{vehiculoSelect}</div>
                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className={cn(
                    "hidden shrink-0 lg:inline-flex",
                    canExport ? "!w-[10.5rem]" : "!w-[9.75rem]",
                  )}
                />
                {canExport ? (
                  <GvExportReporteButton
                    onClick={handleExportReporte}
                    disabled={isLoading || fallasPorVehiculo.length === 0}
                    loading={isExporting}
                    className="max-lg:text-sm"
                  />
                ) : null}
                <Crear compact={!canExport} />
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
          ) : isError ? (
            <GestionVehiculosTableEmpty
              icon={<Wrench className="size-10" />}
              title="No se pudieron cargar las averías"
              description={
                fallasError instanceof Error
                  ? fallasError.message
                  : "Revise la conexión o permisos en Supabase."
              }
            />
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

      {fallaAccion ? (
        <VerEditar
          open
          onClose={() => setFallaAccion(null)}
          modo={fallaAccion.modo}
          falla={fallaAccion.falla}
          mecanicos={mecanicos}
        />
      ) : null}
    </>
  );
}
