"use client";

import { useMemo, useState, useEffect } from "react";
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
import { GvToolbarSelect } from "../lib/gv-toolbar-select";
import { useGvTablePagination } from "../lib/table-pagination";
import { mesCalendarioGt } from "@/lib/fechas-gt";
import { useGvPermissionRole } from "../lib/gv-permissions-hook";
import {
  canExportBitacoraReporte,
  canViewAllBitacoras,
  canViewBitacoraMetricas,
} from "../lib/permissions";
import { type BitacoraRow } from "./lib/zod";
import { useGvPanelActionIntent } from "../lib/gv-panel-action-intent";
import { esBitacoraPendiente, estadoBitacoraNormalizado } from "./lib/bitacora-estado";

const BITACORA_ESTADO_FILTRO_TODAS = "__todas__";
type BitacoraEstadoFiltro = typeof BITACORA_ESTADO_FILTRO_TODAS | "PENDIENTE" | "CONFIRMADA";

const BITACORA_ESTADO_FILTRO_OPTIONS: { value: BitacoraEstadoFiltro; label: string }[] = [
  { value: BITACORA_ESTADO_FILTRO_TODAS, label: "Todas" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "CONFIRMADA", label: "Finalizadas" },
];

export function Bitacoras() {
  const gvRole = useGvPermissionRole();
  const panelIntent = useGvPanelActionIntent();
  const canViewAll = canViewAllBitacoras(gvRole);
  const puedeVerMetricas = canViewBitacoraMetricas(gvRole);
  const puedeExportar = canExportBitacoraReporte(gvRole);
  const { data: bitacoras = [], isLoading: loadingBitacoras } = useBitacoras();
  const { data: vehiculosFlota = [] } = useVehiculos();
  const [confirmarOpen, setConfirmarOpen] = useState(false);
  const [bitacoraAConfirmar, setBitacoraAConfirmar] = useState<BitacoraRow | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingComentarios, setIsExportingComentarios] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);
  const [vehiculoFilter, setVehiculoFilter] = useState(GV_TODOS_VEHICULOS);
  const [estadoFilter, setEstadoFilter] = useState<BitacoraEstadoFiltro>(
    BITACORA_ESTADO_FILTRO_TODAS,
  );
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

  const handleExportComentarios = async () => {
    const vehiculoId =
      vehiculoFilter === GV_TODOS_VEHICULOS ? "all" : vehiculoFilter;

    setIsExportingComentarios(true);
    try {
      const { exportComentariosBitacoraExcel } = await import("./lib/bitacora-comentarios-excel");
      const mesNorm = normalizarMesCalendario(periodoFilter) || mesCalendarioGt();
      const [anioNum, mesNum] = mesNorm.split("-").map(Number);
      const result = await exportComentariosBitacoraExcel({
        vehiculos: vehiculosFlota,
        vehiculoId,
        mes: mesNum,
        anio: anioNum,
      });

      if (result.ok) {
        toast.success("Comentarios exportados exitosamente");
        return;
      }

      if (result.reason === "no_data") {
        toast.warning(
          vehiculoId === "all"
            ? "No hay comentarios de bitácoras confirmadas en el mes seleccionado."
            : "No hay comentarios del vehículo seleccionado en el mes.",
        );
        return;
      }

      toast.error("Hubo un problema al exportar los comentarios.");
    } finally {
      setIsExportingComentarios(false);
    }
  };

  const bitacorasFiltradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bitacoras.filter((b) => {
      if (!bitacoraEnPeriodoCalendario(b.fecha, periodoFilter)) return false;
      const matchVehiculo =
        vehiculoFilter === GV_TODOS_VEHICULOS || b.vehiculo_id === vehiculoFilter;
      if (!matchVehiculo) return false;
      if (
        estadoFilter !== BITACORA_ESTADO_FILTRO_TODAS &&
        estadoBitacoraNormalizado(b.estado) !== estadoFilter
      ) {
        return false;
      }
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
  }, [bitacoras, searchQuery, vehiculoFilter, periodoFilter, estadoFilter]);

  const metricas = useMemo(
    () => computeMetricasBitacorasMes(bitacoras, vehiculoFilter, periodoFilter, GV_TODOS_VEHICULOS),
    [bitacoras, vehiculoFilter, periodoFilter],
  );

  const periodoLabel = useMemo(() => formatPeriodoCalendarioLabel(periodoFilter), [periodoFilter]);

  const hayFiltros =
    periodoFilter !== mesCalendarioGt() ||
    searchQuery.trim().length > 0 ||
    vehiculoFilter !== GV_TODOS_VEHICULOS ||
    estadoFilter !== BITACORA_ESTADO_FILTRO_TODAS;

  const paginacionKey = `${searchQuery}|${vehiculoFilter}|${periodoFilter}|${estadoFilter}`;
  const {
    pageItems: bitacorasPaginadas,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(bitacorasFiltradas, paginacionKey);

  useGvPanelChrome("bitacoras");

  useEffect(() => {
    const pendingId = panelIntent?.pendingBitacoraId;
    if (!pendingId || loading) return;
    const bitacora = bitacoras.find((b) => b.id === pendingId);
    if (!bitacora || !esBitacoraPendiente(bitacora)) {
      panelIntent?.clearPendingBitacora();
      return;
    }
    abrirConfirmacionBitacora(bitacora);
    panelIntent?.clearPendingBitacora();
  }, [
    loading,
    bitacoras,
    panelIntent?.pendingBitacoraId,
    panelIntent?.clearPendingBitacora,
  ]);

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
          puedeVerMetricas && vehiculoFilter !== GV_TODOS_VEHICULOS ? (
            <GvTableKpiSlot>
              <BitacoraStatsCards
                metrics={metricas}
                mesLabel={periodoLabel}
                filtroVehiculo
              />
            </GvTableKpiSlot>
          ) : undefined
        }
        toolbar={
            <div className={GV_TABLE_TOOLBAR_ROW_CLASS}>
              <div className={cn(GV_TABLE_TOOLBAR_PRIMARY_CLASS, "lg:items-center")}>
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
                <GvToolbarSelect
                  value={estadoFilter}
                  onChange={setEstadoFilter}
                  ariaLabel="Filtrar bitácoras por estado"
                  options={BITACORA_ESTADO_FILTRO_OPTIONS}
                  className="hidden w-[11.5rem] shrink-0 lg:block"
                />
                <div className="w-full min-w-0 lg:hidden">{vehiculoSelect}</div>
              </div>

              <div
                className={cn(
                  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
                  GV_TABLE_TOOLBAR_ACTIONS_PAIR_CLASS,
                  "min-w-0 w-full max-lg:col-span-full lg:w-auto lg:shrink-0",
                )}
              >
                <GvToolbarSelect
                  value={estadoFilter}
                  onChange={setEstadoFilter}
                  ariaLabel="Filtrar bitácoras por estado"
                  options={BITACORA_ESTADO_FILTRO_OPTIONS}
                  className="max-lg:order-1 max-lg:w-full lg:hidden"
                />
                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="!h-11 min-w-0 !w-full text-sm max-lg:order-2 lg:hidden"
                />
                <div className="hidden w-auto shrink-0 lg:order-3 lg:block">{vehiculoSelect}</div>
                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="hidden shrink-0 lg:order-4 lg:inline-flex"
                />
                {puedeExportar ? (
                  <>
                    <GvExportReporteButton
                      onClick={handleExportReporte}
                      disabled={loading}
                      loading={isExporting}
                      className="max-lg:order-3 max-lg:h-11 lg:order-5 lg:w-[10.5rem]"
                    />
                    <GvExportReporteButton
                      label="Comentarios"
                      ariaLabel="Exportar comentarios de bitácoras a Excel"
                      onClick={handleExportComentarios}
                      disabled={loading}
                      loading={isExportingComentarios}
                      className="max-lg:order-4 max-lg:h-11 lg:order-6 lg:w-[10.5rem]"
                    />
                  </>
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
                  ? "Prueba con otra fecha, estado, destino, placa o vehículo."
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
