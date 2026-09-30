"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2, Search, BookOpen } from "lucide-react";
import { toast } from "react-toastify";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BitacorasPanel } from "./BitacorasPanel";
import { BitacoraStatsCards } from "./BitacoraStatsCards";
import { Crear } from "./forms/Crear";
import { useBitacoras } from "./lib/hooks";
import { computeMetricasBitacorasMes, extractVehiculosVinculadosBitacoras, formatPeriodoCalendarioLabel, bitacoraEnPeriodoCalendario } from "./lib/helpers";
import { normalizarMesCalendario } from "@/lib/fechas-gt";
import { useVehiculos } from "../flota/lib/hooks";
import { formatVehiculoOpcion } from "../flota/lib/helpers";
import {
  GestionVehiculosTableEmpty,
  GestionVehiculosTableShell,
  GvTableKpiSlot,
  GV_TABLE_BODY_CENTER_CLASS,
  GV_TABLE_VIEWPORT_FILL,
} from "../lib/table-ui";
import { cn } from "@/lib/utils";
import { useGvPanelChrome } from "../lib/gv-page-chrome";
import { GvTableSectionMotion } from "../lib/gv-table-motion";
import { GvExportReporteButton } from "../lib/gv-export-ui";
import {
  GV_FILTRO_FIELD_CLASS,
  GV_HEADER_OUTLINE_BUTTON_CLASS,
  GV_TABLE_SEARCH_INPUT_CLASS,
  GV_TABLE_SEARCH_WRAPPER_CLASS,
  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
  GV_TABLE_TOOLBAR_PRIMARY_CLASS,
  GV_TABLE_TOOLBAR_ROW_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
} from "../lib/gv-header-ui";
import { GvMonthPicker } from "../lib/gv-month-picker";
import { useGvTablePagination } from "../lib/table-pagination";
import { mesCalendarioGt } from "@/lib/fechas-gt";
import { useGvPermissionRole } from "../lib/gv-permissions-hook";
import {
  canExportBitacoraReporte,
  canViewAllBitacoras,
  canViewBitacoraMetricas,
} from "../lib/permissions";
import { type BitacoraRow } from "./lib/zod";

const TODOS_VEHICULOS = "__todos__";

const filtroTriggerClass = cn(
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
  "cursor-pointer px-3 data-[size=default]:h-11 focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25",
);

const filtroContentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

const filtroItemClass =
  "cursor-pointer rounded-lg bg-white font-medium text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800";

export function Bitacoras() {
  const gvRole = useGvPermissionRole();
  const canViewAll = canViewAllBitacoras(gvRole);
  const puedeVerMetricas = canViewBitacoraMetricas(gvRole);
  const puedeExportar = canExportBitacoraReporte(gvRole);
  const { data: bitacoras = [], isLoading: loadingBitacoras } = useBitacoras();
  const { data: vehiculosFlota = [] } = useVehiculos();
  const [createOpen, setCreateOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);
  const [vehiculoFilter, setVehiculoFilter] = useState(TODOS_VEHICULOS);
  const [detailBitacora, setDetailBitacora] = useState<BitacoraRow | null>(null);
  const loading = loadingBitacoras;

  const vehiculosVinculados = useMemo(
    () => extractVehiculosVinculadosBitacoras(bitacoras),
    [bitacoras],
  );

  const vehiculosParaFiltro = canViewAll ? vehiculosFlota : vehiculosVinculados;

  const handleExportReporte = async () => {
    const vehiculoId =
      vehiculoFilter === TODOS_VEHICULOS ? "all" : vehiculoFilter;

    setIsExporting(true);
    try {
      const { exportBitacoraReporteVehiculo } = await import("./lib/bitacora-excel");
      const mesNorm = normalizarMesCalendario(periodoFilter) || mesCalendarioGt();
      const [anioNum, mesNum] = mesNorm.split("-").map(Number);
      const result = await exportBitacoraReporteVehiculo({
        vehiculos: vehiculosFlota,
        vehiculoId,
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
            ? "No hay registros de bitácora en el mes seleccionado."
            : "No hay registros del vehículo seleccionado en el mes seleccionado.",
        );
        return;
      }

      toast.error("Hubo un problema al exportar el reporte.");
    } finally {
      setIsExporting(false);
    }
  };

  const bitacorasFiltradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bitacoras.filter((b) => {
      if (!bitacoraEnPeriodoCalendario(b.fecha, periodoFilter)) return false;
      const matchVehiculo =
        vehiculoFilter === TODOS_VEHICULOS || b.vehiculo_id === vehiculoFilter;
      if (!matchVehiculo) return false;
      if (!q) return true;
      return (
        b.destino.toLowerCase().includes(q) ||
        b.ot_vehiculos?.placa.toLowerCase().includes(q) ||
        b.ot_vehiculos?.marca.toLowerCase().includes(q) ||
        b.ot_vehiculos?.modelo.toLowerCase().includes(q) ||
        (b.profiles?.nombre?.toLowerCase().includes(q) ?? false) ||
        (b.vale_combustible?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [bitacoras, searchQuery, vehiculoFilter, periodoFilter]);

  const metricas = useMemo(
    () => computeMetricasBitacorasMes(bitacoras, vehiculoFilter, periodoFilter, TODOS_VEHICULOS),
    [bitacoras, vehiculoFilter, periodoFilter],
  );

  const periodoLabel = useMemo(() => formatPeriodoCalendarioLabel(periodoFilter), [periodoFilter]);

  const hayFiltros =
    periodoFilter !== mesCalendarioGt() ||
    searchQuery.trim().length > 0 ||
    vehiculoFilter !== TODOS_VEHICULOS;

  const paginacionKey = `${searchQuery}|${vehiculoFilter}|${periodoFilter}`;
  const {
    pageItems: bitacorasPaginadas,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(bitacorasFiltradas, paginacionKey);

  useGvPanelChrome("bitacoras");

  const vehiculoFiltroTriggerClass = cn(
    filtroTriggerClass,
    canViewAll
      ? "w-full min-w-0 max-w-none lg:min-w-[12rem] lg:max-w-[min(26rem,32vw)]"
      : "w-full min-w-0 max-w-none lg:!w-auto lg:min-w-[8.75rem] lg:max-w-[10.5rem] shrink-0",
  );

  const vehiculoSelect = (
    <Select value={vehiculoFilter} onValueChange={setVehiculoFilter}>
      <SelectTrigger className={vehiculoFiltroTriggerClass}>
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
      <Crear
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => setCreateOpen(false)}
      />
      <GvTableSectionMotion panelId="bitacoras">
      <GestionVehiculosTableShell
        className="min-h-0 flex-1"
        visibleRows={GV_TABLE_VIEWPORT_FILL}
        kpiSlot={
          puedeVerMetricas ? (
            <GvTableKpiSlot>
              <BitacoraStatsCards
                metrics={metricas}
                mesLabel={periodoLabel}
                filtroVehiculo={vehiculoFilter !== TODOS_VEHICULOS}
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
                    placeholder="Buscar destino, placa o conductor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(GV_TABLE_SEARCH_INPUT_CLASS, "pl-10")}
                  />
                </div>
                <div className="w-full min-w-0 lg:hidden">{vehiculoSelect}</div>
                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="!h-11 min-w-0 w-full text-xs sm:w-[10.5rem] lg:hidden"
                />
              </div>

              <div className={cn(GV_TABLE_TOOLBAR_ACTIONS_CLASS, "max-lg:justify-end")}>
                <div className="hidden w-auto shrink-0 lg:block">{vehiculoSelect}</div>
                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="hidden shrink-0 lg:inline-flex"
                />
                {puedeExportar ? (
                  <GvExportReporteButton
                    onClick={handleExportReporte}
                    disabled={loading}
                    loading={isExporting}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className={cn(GV_HEADER_OUTLINE_BUTTON_CLASS, "w-auto shrink-0")}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="lg:hidden">Viaje</span>
                  <span className="hidden lg:inline">Registrar viaje</span>
                </button>
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
          {loading ? (
            <div className={GV_TABLE_BODY_CENTER_CLASS}>
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          ) : bitacorasFiltradas.length === 0 ? (
            <GestionVehiculosTableEmpty
              icon={<BookOpen className="size-10 text-celeste-trifinio/70" />}
              title={hayFiltros ? "Sin coincidencias" : "Sin bitácoras"}
              description={
                hayFiltros
                  ? "Prueba con otra fecha, destino, placa o vehículo."
                  : "Aún no se ha registrado ningún viaje en la bitácora digital."
              }
            />
          ) : (
            <BitacorasPanel
              bitacoras={bitacorasPaginadas}
              catalogo={bitacorasFiltradas}
              detail={detailBitacora}
              onDetailChange={setDetailBitacora}
            />
          )}
        </GestionVehiculosTableShell>
      </GvTableSectionMotion>
    </>
  );
}
