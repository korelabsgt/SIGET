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
import { BitacorasNotificaciones } from "./BitacorasNotificaciones";
import { BitacoraStatsCards } from "./BitacoraStatsCards";
import { Crear } from "./forms/Crear";
import { useBitacoras } from "./lib/hooks";
import { computeMetricasBitacorasMes, extractVehiculosVinculadosBitacoras, formatPeriodoCalendarioLabel, bitacoraEnPeriodoCalendario } from "./lib/helpers";
import { normalizarMesCalendario } from "@/lib/fechas-gt";
import { useVehiculos } from "../flota/lib/hooks";
import { formatVehiculoOpcion } from "../flota/lib/helpers";
import { GestionVehiculosTableShell, gvTableVisibleRowCount } from "../lib/table-ui";
import { GV_PANEL_KPI_STACK_CLASS } from "../lib/page-shell";
import { useGvLgUp } from "../lib/gv-breakpoint";
import { cn } from "@/lib/utils";
import { useGvPanelChrome } from "../lib/gv-page-chrome";
import { GvTableSectionMotion } from "../lib/gv-table-motion";
import { useGvSection } from "../lib/tab-context";
import { GvExportReporteButton } from "../lib/gv-export-ui";
import {
  GV_FILTRO_FIELD_CLASS,
  GV_HEADER_OUTLINE_BUTTON_CLASS,
  GV_TABLE_SEARCH_INPUT_CLASS,
  GV_TABLE_SEARCH_WRAPPER_CLASS,
} from "../lib/gv-header-ui";
import { GvMonthPicker } from "../lib/gv-month-picker";
import { useGvTablePagination } from "../lib/table-pagination";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { mesCalendarioGt } from "@/lib/fechas-gt";
import {
  canExportBitacoraReporte,
  canViewAllBitacoras,
} from "../lib/permissions";
import { type BitacoraRow } from "./lib/zod";

type BitacorasView = { mode: "list" } | { mode: "create" };

const TODOS_VEHICULOS = "__todos__";

const filtroTriggerClass = cn(
  GV_FILTRO_FIELD_CLASS,
  "cursor-pointer px-3 data-[size=default]:h-11 focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25",
);

const filtroContentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

const filtroItemClass =
  "cursor-pointer rounded-lg bg-white font-medium text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800";

export function Bitacoras() {
  const { effectiveRole } = useUserContext();
  const canViewAll = canViewAllBitacoras(effectiveRole);
  const canExport = canExportBitacoraReporte(effectiveRole);
  const { data: bitacoras = [], isLoading: loadingBitacoras } = useBitacoras();
  const { data: vehiculosFlota = [] } = useVehiculos();
  const [view, setView] = useState<BitacorasView>({ mode: "list" });
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);
  const [vehiculoFilter, setVehiculoFilter] = useState(TODOS_VEHICULOS);
  const [detailBitacora, setDetailBitacora] = useState<BitacoraRow | null>(null);
  const gvSection = useGvSection();
  const panelActive = gvSection?.section === "bitacoras";
  const lgUp = useGvLgUp();
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
    const q = canViewAll ? searchQuery.trim().toLowerCase() : "";
    return bitacoras.filter((b) => {
      if (!bitacoraEnPeriodoCalendario(b.fecha, periodoFilter)) return false;
      const matchVehiculo =
        vehiculoFilter === TODOS_VEHICULOS || b.vehiculo_id === vehiculoFilter;
      if (!matchVehiculo) return false;
      if (!q) return true;
      return (
        b.destino.toLowerCase().includes(q) ||
        b.ter_vehiculos?.placa.toLowerCase().includes(q) ||
        b.ter_vehiculos?.marca.toLowerCase().includes(q) ||
        b.ter_vehiculos?.modelo.toLowerCase().includes(q) ||
        (b.profiles?.nombre?.toLowerCase().includes(q) ?? false) ||
        (b.vale_combustible?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [bitacoras, searchQuery, vehiculoFilter, periodoFilter, canViewAll]);

  const metricas = useMemo(
    () => computeMetricasBitacorasMes(bitacoras, vehiculoFilter, periodoFilter, TODOS_VEHICULOS),
    [bitacoras, vehiculoFilter, periodoFilter],
  );

  const periodoLabel = useMemo(() => formatPeriodoCalendarioLabel(periodoFilter), [periodoFilter]);

  const hayFiltros =
    periodoFilter !== mesCalendarioGt() ||
    (canViewAll && searchQuery.trim().length > 0) ||
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

  const tableVisibleRows = gvTableVisibleRowCount(
    bitacorasPaginadas.length,
    !loading && bitacorasFiltradas.length === 0,
  );

  const bitacorasParaAlertas = useMemo(
    () => bitacoras.filter((bitacora) => bitacoraEnPeriodoCalendario(bitacora.fecha, periodoFilter)),
    [bitacoras, periodoFilter],
  );

  const headerExtras = useMemo(
    () =>
      !loading && view.mode === "list" ? (
        <BitacorasNotificaciones bitacoras={bitacorasParaAlertas} />
      ) : null,
    [loading, view.mode, bitacorasParaAlertas],
  );

  useGvPanelChrome("bitacoras", {
    hideChrome: view.mode === "create",
    headerExtras,
  });

  if (view.mode === "create") {
    return <Crear onBack={() => setView({ mode: "list" })} onSaved={() => setView({ mode: "list" })} />;
  }

  return (
    <div className={GV_PANEL_KPI_STACK_CLASS}>
      {panelActive && canViewAll ? (
        <BitacoraStatsCards
          metrics={metricas}
          mesLabel={periodoLabel}
          filtroVehiculo={vehiculoFilter !== TODOS_VEHICULOS}
        />
      ) : null}

      <GvTableSectionMotion panelId="bitacoras">
        <GestionVehiculosTableShell
          visibleRows={lgUp ? tableVisibleRows : null}
          toolbar={
            <div className="flex flex-col gap-2 md:col-span-2 lg:flex-row lg:items-center lg:gap-3">
                {canViewAll ? (
                  <div className={cn(GV_TABLE_SEARCH_WRAPPER_CLASS, "w-full lg:min-w-0 lg:flex-1")}>
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-celeste-trifinio" />
                    <input
                      type="text"
                      placeholder="Buscar"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={GV_TABLE_SEARCH_INPUT_CLASS}
                    />
                  </div>
                ) : null}

                <div className="w-full lg:hidden">
                  <Select value={vehiculoFilter} onValueChange={setVehiculoFilter}>
                    <SelectTrigger
                      className={cn(
                        filtroTriggerClass,
                        "h-11 px-2 text-xs data-[size=default]:h-11",
                      )}
                    >
                      <SelectValue
                        placeholder={
                          canViewAll ? "Todos los vehículos" : "Mis vehículos"
                        }
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
                </div>

                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="!h-11 !w-full text-xs lg:hidden"
                />

                <div className="hidden w-[12rem] shrink-0 lg:block">
                  <Select value={vehiculoFilter} onValueChange={setVehiculoFilter}>
                    <SelectTrigger className={filtroTriggerClass}>
                      <SelectValue
                        placeholder={
                          canViewAll ? "Todos los vehículos" : "Mis vehículos"
                        }
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
                </div>

                <div
                  className={cn(
                    "grid w-full gap-2 lg:flex lg:flex-row lg:flex-nowrap lg:items-center lg:ml-auto lg:w-auto lg:shrink-0",
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
                      disabled={loading}
                      loading={isExporting}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setView({ mode: "create" })}
                    className={GV_HEADER_OUTLINE_BUTTON_CLASS}
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
            <div className="flex min-h-full items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          ) : bitacorasFiltradas.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center px-4 py-16 text-center">
              <BookOpen className="mb-4 size-10 text-celeste-trifinio/70" />
              <p className="font-semibold text-foreground">
                {hayFiltros ? "Sin coincidencias" : "Sin bitácoras"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hayFiltros
                  ? "Prueba con otra fecha, destino, placa o vehículo."
                  : "Aún no se ha registrado ningún viaje en la bitácora digital."}
              </p>
            </div>
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
    </div>
  );
}
