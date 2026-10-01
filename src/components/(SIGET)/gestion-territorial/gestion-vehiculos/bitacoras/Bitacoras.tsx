"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, BookOpen } from "lucide-react";
import { toast } from "react-toastify";

import { BitacorasPanel } from "./BitacorasPanel";
import { BitacoraStatsCards } from "./BitacoraStatsCards";
import { Crear } from "./forms/Crear";
import { useBitacoras } from "./lib/hooks";
import {
  computeMetricasBitacorasMes,
  extractVehiculosVinculadosBitacoras,
  formatPeriodoCalendarioLabel,
  bitacoraEnPeriodoCalendario,
  nombreSolicitanteBitacora,
} from "./lib/helpers";
import { normalizarMesCalendario } from "@/lib/fechas-gt";
import { useVehiculos } from "../flota/lib/hooks";
import {
  GestionVehiculosTableEmpty,
  GestionVehiculosTableShell,
  GvTableKpiSlot,
  GV_TABLE_BODY_CENTER_CLASS,
  GV_TABLE_RECORD_SCROLL,
} from "../lib/table-ui";
import { cn } from "@/lib/utils";
import { useGvPanelChrome } from "../lib/gv-page-chrome";
import { GvTableSectionMotion } from "../lib/gv-table-motion";
import { GvExportReporteButton } from "../lib/gv-export-ui";
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

export function Bitacoras() {
  const gvRole = useGvPermissionRole();
  const canViewAll = canViewAllBitacoras(gvRole);
  const puedeVerMetricas = canViewBitacoraMetricas(gvRole);
  const puedeExportar = canExportBitacoraReporte(gvRole);
  const { data: bitacoras = [], isLoading: loadingBitacoras } = useBitacoras();
  const { data: vehiculosFlota = [] } = useVehiculos();
  const [confirmarOpen, setConfirmarOpen] = useState(false);
  const [bitacoraAConfirmar, setBitacoraAConfirmar] = useState<BitacoraRow | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);
  const [vehiculoFilter, setVehiculoFilter] = useState(GV_TODOS_VEHICULOS);
  const [detailBitacora, setDetailBitacora] = useState<BitacoraRow | null>(null);
  const loading = loadingBitacoras;

  const abrirConfirmacionBitacora = (bitacora: BitacoraRow) => {
    setBitacoraAConfirmar(bitacora);
    setConfirmarOpen(true);
  };

  const vehiculosVinculados = useMemo(
    () => extractVehiculosVinculadosBitacoras(bitacoras),
    [bitacoras],
  );

  const vehiculosParaFiltro = canViewAll ? vehiculosFlota : vehiculosVinculados;

  const handleExportReporte = async () => {
    const vehiculoId =
      vehiculoFilter === GV_TODOS_VEHICULOS ? "all" : vehiculoFilter;

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
            ? "No hay bitácoras confirmadas en el mes seleccionado."
            : "No hay bitácoras confirmadas del vehículo seleccionado en el mes.",
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
        vehiculoFilter === GV_TODOS_VEHICULOS || b.vehiculo_id === vehiculoFilter;
      if (!matchVehiculo) return false;
      if (!q) return true;
      return (
        b.destino.toLowerCase().includes(q) ||
        b.ot_vehiculos?.placa.toLowerCase().includes(q) ||
        b.ot_vehiculos?.marca.toLowerCase().includes(q) ||
        b.ot_vehiculos?.modelo.toLowerCase().includes(q) ||
        nombreSolicitanteBitacora(b).toLowerCase().includes(q) ||
        (b.vale_combustible?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [bitacoras, searchQuery, vehiculoFilter, periodoFilter]);

  const metricas = useMemo(
    () => computeMetricasBitacorasMes(bitacoras, vehiculoFilter, periodoFilter, GV_TODOS_VEHICULOS),
    [bitacoras, vehiculoFilter, periodoFilter],
  );

  const periodoLabel = useMemo(() => formatPeriodoCalendarioLabel(periodoFilter), [periodoFilter]);

  const hayFiltros =
    periodoFilter !== mesCalendarioGt() ||
    searchQuery.trim().length > 0 ||
    vehiculoFilter !== GV_TODOS_VEHICULOS;

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
      <Crear
        open={confirmarOpen}
        onOpenChange={(open) => {
          setConfirmarOpen(open);
          if (!open) setBitacoraAConfirmar(null);
        }}
        bitacoraPendiente={bitacoraAConfirmar}
        onSaved={() => {
          setConfirmarOpen(false);
          setBitacoraAConfirmar(null);
        }}
      />
      <GvTableSectionMotion panelId="bitacoras">
      <GestionVehiculosTableShell
        visibleRows={GV_TABLE_RECORD_SCROLL}
        kpiSlot={
          puedeVerMetricas ? (
            <GvTableKpiSlot>
              <BitacoraStatsCards
                metrics={metricas}
                mesLabel={periodoLabel}
                filtroVehiculo={vehiculoFilter !== GV_TODOS_VEHICULOS}
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
                    placeholder="Buscar destino, placa o solicitante..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(GV_TABLE_SEARCH_INPUT_CLASS, "pl-10")}
                  />
                </div>
                <div className="w-full min-w-0 lg:hidden">{vehiculoSelect}</div>
              </div>

              <div
                className={cn(
                  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
                  puedeExportar ? GV_TABLE_TOOLBAR_ACTIONS_PAIR_CLASS : null,
                )}
              >
                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="!h-11 min-w-0 w-full text-sm lg:hidden"
                />
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
                    className="max-lg:h-11"
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
              onConfirmarPendiente={abrirConfirmacionBitacora}
            />
          )}
        </GestionVehiculosTableShell>
      </GvTableSectionMotion>
    </>
  );
}
