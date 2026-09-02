"use client";

import { useMemo, useState } from "react";
import { MantenimientoPanel } from "./MantenimientoPanel";
import { MantenimientoStatsCards } from "./MantenimientoStatsCards";
import { Crear } from "./forms/Crear";
import { ChevronLeft, Loader2 } from "lucide-react";
import { differenceInDays } from "date-fns";
import { toast } from "react-toastify";
import { SubmodulosNav } from "../../SubmodulosNav";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useFallasMantenimiento, useMecanicos } from "./lib/hooks";
import { GestionVehiculosTableShell } from "../lib/table-ui";
import { GV_MODULO_PAGE_CLASS } from "../lib/page-shell";
import { GvExportReporteButton } from "../lib/gv-export-ui";
import { GV_HEADER_ACTIONS_CLASS } from "../lib/gv-header-ui";
import { GvMonthPicker } from "../lib/gv-month-picker";
import { GvSwitchGroup, GvSwitchItem } from "../lib/switch-ui";
import { filtrarFallasMantenimiento } from "./lib/helpers";
import { registroEnPeriodoCalendario } from "../lib/periodo-filtro";
import { useGvTablePagination } from "../lib/table-pagination";
import { mesCalendarioGt } from "@/lib/fechas-gt";
import {
  canExportMantenimientoReporte,
  canGestionarFallasMantenimiento,
  canManageMantenimiento,
} from "../lib/permissions";

const TABS = ["ACTIVAS", "CRITICAS", "SOLVENTADAS"] as const;
type TabMantenimiento = (typeof TABS)[number];

const TAB_LABELS: Record<TabMantenimiento, string> = {
  ACTIVAS: "Taller",
  CRITICAS: "Alta",
  SOLVENTADAS: "Solventadas",
};

export function Mantenimiento() {
  const router = useRouter();
  const { effectiveRole } = useUserContext();
  const canManage = canManageMantenimiento(effectiveRole);
  const canExport = canExportMantenimientoReporte(effectiveRole);
  const canGestionar = canGestionarFallasMantenimiento(effectiveRole);
  const { data: fallas = [], isLoading } = useFallasMantenimiento();
  const { data: mecanicos = [] } = useMecanicos();
  const [tabActiva, setTabActiva] = useState<TabMantenimiento>("ACTIVAS");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);
  const [enDetalle, setEnDetalle] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    <div className={GV_MODULO_PAGE_CLASS}>
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />

      {!enDetalle ? <SubmodulosNav /> : null}

      {!enDetalle ? (
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
              Mantenimiento y Averías
            </h1>
          </div>
        </div>
      </div>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-celeste-trifinio" />
          <p className="text-muted-foreground">Cargando mantenimiento...</p>
        </div>
      ) : (
        <>
          {!enDetalle ? (
            <>
              {canManage ? (
                <MantenimientoStatsCards
                  metrics={{
                    fallasActivas,
                    unidadesFueraDeServicio,
                    promedioDias,
                  }}
                />
              ) : null}
            </>
          ) : null}

          <div>
            <GestionVehiculosTableShell
              className={
                enDetalle
                  ? "overflow-visible rounded-none border-0 bg-transparent dark:bg-transparent"
                  : undefined
              }
              toolbar={
                !enDetalle ? (
                  <div className="flex flex-col gap-3 md:col-span-2 lg:flex-row lg:items-center lg:justify-between">
                    {canManage ? (
                      <GvSwitchGroup layoutId="gv-mantenimiento-tabs" layout="responsive-grid">
                        {TABS.map((tab) => (
                          <GvSwitchItem
                            key={tab}
                            active={tabActiva === tab}
                            onClick={() => setTabActiva(tab)}
                            size="sm"
                            fill
                            tone={tab === "CRITICAS" ? "danger" : "default"}
                          >
                            {TAB_LABELS[tab]}
                          </GvSwitchItem>
                        ))}
                      </GvSwitchGroup>
                    ) : null}

                    <div className={`${GV_HEADER_ACTIONS_CLASS} lg:ml-auto`}>
                      <GvMonthPicker value={periodoFilter} onChange={setPeriodoFilter} />
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
                ) : undefined
              }
              pagination={
                !enDetalle
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
              <MantenimientoPanel
                fallas={fallasPaginadas}
                catalogo={fallasFiltradas}
                mecanicos={mecanicos}
                isAuthorized={canGestionar}
                onDetailViewChange={setEnDetalle}
              />
            </GestionVehiculosTableShell>
          </div>
        </>
      )}
    </div>
  );
}
