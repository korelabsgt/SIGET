"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ChevronLeft, Search, BookOpen } from "lucide-react";
import { toast } from "react-toastify";

import { SubmodulosNav } from "../../SubmodulosNav";
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
import { GestionVehiculosTableShell } from "../lib/table-ui";
import { cn } from "@/lib/utils";
import { GV_MODULO_PAGE_CLASS } from "../lib/page-shell";
import { GvExportReporteButton } from "../lib/gv-export-ui";
import {
  GV_FILTRO_FIELD_CLASS,
  GV_HEADER_ACTIONS_CLASS,
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
  const router = useRouter();
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
  const [inDetailView, setInDetailView] = useState(false);
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

  if (view.mode === "create") {
    return (
      <div className={GV_MODULO_PAGE_CLASS}>
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />
        <Crear onBack={() => setView({ mode: "list" })} onSaved={() => setView({ mode: "list" })} />
      </div>
    );
  }

  return (
    <div className={GV_MODULO_PAGE_CLASS}>
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />

      {!inDetailView ? <SubmodulosNav /> : null}

      {!inDetailView ? (
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push("/siget")}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
              Gestión Territorial
            </p>
            <h1 className="text-2xl font-black uppercase leading-tight tracking-tight text-foreground md:text-3xl">
              Bitácora de Viajes
            </h1>
          </div>
        </div>
      </div>
      ) : null}

      {!inDetailView && canViewAll ? (
        <BitacoraStatsCards
          metrics={metricas}
          mesLabel={periodoLabel}
          filtroVehiculo={vehiculoFilter !== TODOS_VEHICULOS}
        />
      ) : null}

      <div className={cn("mt-2", inDetailView && "mt-0")}>
        <GestionVehiculosTableShell
          className={
            inDetailView
              ? "overflow-visible rounded-none border-0 bg-transparent dark:bg-transparent"
              : undefined
          }
          toolbar={
            !inDetailView ? (
              <div className="flex w-full flex-row flex-nowrap items-center gap-3 md:col-span-2">
                {canViewAll ? (
                  <div className={GV_TABLE_SEARCH_WRAPPER_CLASS}>
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

                <div
                  className={cn(
                    "flex shrink-0 flex-row flex-nowrap items-center gap-2",
                    !canViewAll && "ml-auto",
                  )}
                >
                  <GvMonthPicker value={periodoFilter} onChange={setPeriodoFilter} />

                  <div className="w-[12rem] shrink-0">
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

                  <div className={GV_HEADER_ACTIONS_CLASS}>
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
                      <Plus className="h-4 w-4" />
                      Registrar Viaje
                    </button>
                  </div>
                </div>
              </div>
            ) : undefined
          }
          pagination={
            !loading && !inDetailView && bitacorasFiltradas.length > 0
              ? {
                  pageSafe,
                  totalPages,
                  pageSize,
                  onPageChange: setPage,
                  onPageSizeChange: (size) => {
                    setPageSize(size);
                    setPage(1);
                  },
                }
              : undefined
          }
        >
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          ) : bitacorasFiltradas.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <BookOpen className="mx-auto mb-4 size-10 text-celeste-trifinio/70" />
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
              onDetailViewChange={setInDetailView}
            />
          )}
        </GestionVehiculosTableShell>
      </div>
    </div>
  );
}
