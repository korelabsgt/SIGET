"use client";

import { useMemo, useState } from "react";
import { MantenimientoPanel } from "./MantenimientoPanel";
import { MantenimientoNotificaciones } from "./MantenimientoNotificaciones";
import { MantenimientoStatsCards } from "./MantenimientoStatsCards";
import { Crear } from "./forms/Crear";
import { Loader2 } from "lucide-react";
import { differenceInDays } from "date-fns";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFallasMantenimiento, useMecanicos } from "./lib/hooks";
import { useVehiculos } from "../flota/lib/hooks";
import { formatVehiculoOpcion } from "../flota/lib/helpers";
import { GestionVehiculosTableShell, GvTableKpiSlot, GV_TABLE_BODY_CENTER_CLASS, gvTableShellVisibleRows } from "../lib/table-ui";
import {
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
  GV_TABLE_TOOLBAR_PRIMARY_CLASS,
  GV_TABLE_TOOLBAR_ROW_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
  GV_TABLE_TOOLBAR_SELECT_WRAP_CLASS,
} from "../lib/gv-header-ui";
import { useGvPanelChrome, GvHeaderExtras } from "../lib/gv-page-chrome";
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

const TODOS_VEHICULOS = "__todos__";

const TAB_LABELS: Record<TabMantenimiento, string> = {
  ACTIVAS: "Taller",
  CRITICAS: "Alta",
  SOLVENTADAS: "Solventadas",
};

const filtroTriggerClass = cn(
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
);

const filtroContentClass =
  "z-[200] max-h-60 border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

const filtroItemClass =
  "cursor-pointer rounded-lg bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800";

export function Mantenimiento() {
  const gvRole = useGvPermissionRole();
  const canManage = canManageMantenimiento(gvRole);
  const canExport = canExportMantenimientoReporte(gvRole);
  const canGestionar = canGestionarFallasMantenimiento(gvRole);
  const canViewAll = canViewAllFallasMantenimiento(gvRole);
  const { data: fallas = [], isLoading } = useFallasMantenimiento();
  const { data: mecanicos = [] } = useMecanicos();
  const { data: vehiculosFlota = [] } = useVehiculos();
  const [tabActiva, setTabActiva] = useState<TabMantenimiento>("ACTIVAS");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);
  const [vehiculoFilter, setVehiculoFilter] = useState(TODOS_VEHICULOS);
  const [isExporting, setIsExporting] = useState(false);
  const [detailFalla, setDetailFalla] = useState<FallaRow | null>(null);

  const vehiculosVinculados = useMemo(
    () => extractVehiculosVinculadosFallas(fallas),
    [fallas],
  );

  const vehiculosParaFiltro = canViewAll ? vehiculosFlota : vehiculosVinculados;

  const fallasDelPeriodo = useMemo(
    () => fallas.filter((f) => registroEnPeriodoCalendario(f.created_at, periodoFilter)),
    [fallas, periodoFilter],
  );

  const fallasPorVehiculo = useMemo(
    () => filtrarFallasPorVehiculo(fallasDelPeriodo, vehiculoFilter, TODOS_VEHICULOS),
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

  const fallasFiltradas = filtrarFallasMantenimiento(
    fallasPorVehiculo,
    canManage ? tabActiva : "ACTIVAS",
  );
  const paginacionKey = `${canManage ? tabActiva : "ACTIVAS"}|${periodoFilter}|${vehiculoFilter}`;
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
    const vehiculoId =
      vehiculoFilter === TODOS_VEHICULOS ? "all" : vehiculoFilter;

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

  const vehiculoSelect = (
    <Select value={vehiculoFilter} onValueChange={setVehiculoFilter}>
      <SelectTrigger className={filtroTriggerClass}>
        <SelectValue
          placeholder={canViewAll ? "Todos los vehículos" : "Mis vehículos"}
        />
      </SelectTrigger>
      <SelectContent position="popper" className={filtroContentClass}>
        <SelectItem
          value={TODOS_VEHICULOS}
          textValue={canViewAll ? "Todos los vehículos" : "Mis vehículos"}
          className={filtroItemClass}
        >
          {canViewAll ? "Todos los vehículos" : "Mis vehículos"}
        </SelectItem>
        {vehiculosParaFiltro
          .filter((v) => v.id)
          .map((v) => {
            const label = formatVehiculoOpcion(v);
            return (
              <SelectItem
                key={v.id}
                value={v.id as string}
                textValue={label}
                className={filtroItemClass}
              >
                {label}
              </SelectItem>
            );
          })}
      </SelectContent>
    </Select>
  );

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

                <div className="w-full lg:hidden">
                  {vehiculoSelect}
                </div>

                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="!h-11 min-w-0 w-full text-xs lg:hidden sm:w-[10.5rem]"
                />
              </div>

              <div className={GV_TABLE_TOOLBAR_ACTIONS_CLASS}>
                <div className={GV_TABLE_TOOLBAR_SELECT_WRAP_CLASS}>
                  <div className="hidden lg:block">{vehiculoSelect}</div>
                </div>
                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="hidden lg:inline-flex"
                />
                {canExport ? (
                  <GvExportReporteButton
                    onClick={handleExportReporte}
                    disabled={isLoading || fallasPorVehiculo.length === 0}
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
