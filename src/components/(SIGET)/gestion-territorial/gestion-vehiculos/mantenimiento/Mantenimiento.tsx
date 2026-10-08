"use client";

import { useEffect, useMemo, useState } from "react";
import { MantenimientoPanel } from "./MantenimientoPanel";
import { MantenimientoStatsCards } from "./MantenimientoStatsCards";
import { Crear } from "./forms/Crear";
import { VerEditar } from "./forms/VerEditar";
import { Loader2, Search, Wrench } from "lucide-react";
import { differenceInDays } from "date-fns";
import { toast } from "react-toastify";
import { useFallasMantenimiento, useMecanicos } from "./lib/hooks";
import { useVehiculos } from "../flota/lib/hooks";
import {
  GestionVehiculosTableEmpty,
  GestionVehiculosTableShell,
  GvTableKpiSlot,
  GV_TABLE_BODY_CENTER_CLASS,
  GV_TABLE_RECORD_SCROLL,
} from "../lib/table-ui";
import {
  GV_TABLE_SEARCH_INPUT_CLASS,
  GV_TABLE_SEARCH_WRAPPER_CLASS,
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
import { GvToolbarSelect } from "../lib/gv-toolbar-select";
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
  const [searchQuery, setSearchQuery] = useState("");
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

  const fallasPorTab = useMemo(
    () => filtrarFallasMantenimiento(fallasPorVehiculo, tabActiva),
    [fallasPorVehiculo, tabActiva],
  );

  const fallasFiltradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return fallasPorTab;
    return fallasPorTab.filter((falla) => {
      const placa = falla.vehiculo?.placa?.toLowerCase() ?? "";
      const marca = falla.vehiculo?.marca?.toLowerCase() ?? "";
      const modelo = falla.vehiculo?.modelo?.toLowerCase() ?? "";
      const descripcion = falla.descripcion?.toLowerCase() ?? "";
      return (
        placa.includes(q) ||
        marca.includes(q) ||
        modelo.includes(q) ||
        descripcion.includes(q)
      );
    });
  }, [fallasPorTab, searchQuery]);

  const paginacionKey = `${tabActiva}|${periodoFilter}|${vehiculoFilter}|${searchQuery}`;
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

  const filtrosEstadoVehiculoFilaClass = "hidden shrink-0 items-center gap-1 lg:flex";

  const estadoFiltroAnchoClass = "w-[9rem] min-w-[9rem] max-w-[9rem] shrink-0";

  const vehiculoFiltroAnchoDesktopClass = canViewAll
    ? "w-max min-w-[11.5rem] max-w-[22rem] shrink-0"
    : "w-[9.5rem] min-w-[9.5rem] max-w-[9.5rem] shrink-0";

  const vehiculoFiltroTriggerClass = "w-full min-w-0 max-w-full";

  const vehiculoFiltroTriggerDesktopClass = cn(
    vehiculoFiltroTriggerClass,
    "w-auto min-w-full max-w-[22rem] [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-nowrap",
  );

  const estadoFiltroOptions = TABS.map((tab) => ({
    value: tab,
    label: TAB_LABELS[tab],
  }));

  const vehiculoSelectProps = {
    value: vehiculoFilter,
    onValueChange: setVehiculoFilter,
    vehiculos: vehiculosParaFiltro,
    canViewAll,
    todosValue: GV_TODOS_VEHICULOS,
  };

  const vehiculoSelectDesktop = (
    <GvVehiculoFiltroSelect
      {...vehiculoSelectProps}
      triggerClassName={vehiculoFiltroTriggerDesktopClass}
    />
  );

  const vehiculoSelectMobile = (
    <GvVehiculoFiltroSelect
      {...vehiculoSelectProps}
      triggerClassName={vehiculoFiltroTriggerClass}
    />
  );

  return (
    <>
      <GvTableSectionMotion panelId="mantenimiento">
      <GestionVehiculosTableShell
        visibleRows={GV_TABLE_RECORD_SCROLL}
        kpiSlot={
          canManage && vehiculoFilter !== GV_TODOS_VEHICULOS ? (
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
                <div className={cn(GV_TABLE_SEARCH_WRAPPER_CLASS, "min-w-0 w-full flex-1")}>
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-celeste-trifinio" />
                  <input
                    type="text"
                    placeholder="Buscar placa, vehículo o descripción..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(GV_TABLE_SEARCH_INPUT_CLASS, "pl-10")}
                  />
                </div>

                <div className={filtrosEstadoVehiculoFilaClass}>
                  <GvToolbarSelect
                    value={tabActiva}
                    onChange={setTabActiva}
                    ariaLabel="Filtrar averías por estado"
                    className={estadoFiltroAnchoClass}
                    options={estadoFiltroOptions}
                  />
                  <div className={vehiculoFiltroAnchoDesktopClass}>{vehiculoSelectDesktop}</div>
                  <GvMonthPicker
                    value={periodoFilter}
                    onChange={setPeriodoFilter}
                    className={cn(
                      "hidden shrink-0 lg:inline-flex",
                      canExport ? "!w-[10.5rem]" : "!w-[9.75rem]",
                    )}
                  />
                </div>

                <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:hidden">
                  <GvToolbarSelect
                    value={tabActiva}
                    onChange={setTabActiva}
                    ariaLabel="Filtrar averías por estado"
                    className="sm:w-[11.5rem]"
                    options={estadoFiltroOptions}
                  />
                  <div className="min-w-0 w-full flex-1 [&_[data-slot=select-trigger]]:w-full">
                    {vehiculoSelectMobile}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
                  GV_TABLE_TOOLBAR_ACTIONS_PAIR_CLASS,
                  "min-w-0 w-full max-lg:col-span-full lg:w-auto lg:shrink-0",
                )}
              >
                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="!h-11 min-w-0 !w-full text-sm max-lg:order-1 max-lg:col-span-2 lg:hidden"
                />
                <div className="max-lg:order-2 max-lg:min-w-0 max-lg:w-full shrink-0">
                  <Crear compact={!canExport} />
                </div>
                {canExport ? (
                  <GvExportReporteButton
                    onClick={handleExportReporte}
                    disabled={isLoading || fallasPorVehiculo.length === 0}
                    loading={isExporting}
                    className="max-lg:order-3 max-lg:h-11 max-lg:text-sm lg:w-[10.5rem]"
                  />
                ) : null}
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
