"use client";

import { useEffect, useMemo, useState } from "react";
import { Car, CarFront, CirclePlus, Loader2, Plus } from "lucide";
import { toast } from "react-toastify";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GestionVehiculosTableShell,
  GV_TABLE_BODY_CENTER_CLASS,
  gvTableShellVisibleRows,
} from "../../gestion-vehiculos/lib/table-ui";
import { GvTabFilter } from "../../gestion-vehiculos/lib/gv-tab-filter";
import { GvSigetActionButton, sigetAccent } from "../../gestion-vehiculos/lib/gv-siget-action-button";
import { GvMorphIcon } from "../../gestion-vehiculos/lib/morph-icon";
import {
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
  GV_TABLE_TOOLBAR_PRIMARY_CLASS,
  GV_TABLE_TOOLBAR_ROW_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
} from "../../gestion-vehiculos/lib/gv-header-ui";
import { GvExportReporteButton } from "../../gestion-vehiculos/lib/gv-export-ui";
import { GvMonthPicker } from "../../gestion-vehiculos/lib/gv-month-picker";
import { useGvTablePagination } from "../../gestion-vehiculos/lib/table-pagination";
import { useVehiculos } from "../../gestion-vehiculos/flota/lib/hooks";
import {
  formatVehiculoOpcion,
  listarVehiculosCatalogoFlota,
} from "../../gestion-vehiculos/flota/lib/helpers";
import { cn } from "@/lib/utils";
import { mesCalendarioGt } from "@/lib/fechas-gt";
import { useGvPermissionRole } from "../../gestion-vehiculos/lib/gv-permissions-hook";
import { useGvClientMounted } from "../../gestion-vehiculos/lib/use-gv-client-mounted";
import {
  canAprobarRechazarSolicitudCombustible,
  canExportCombustibleExcel,
} from "../lib/permissions";

import {
  filtrarRequisicionesCombustible,
  filtrarSolicitudesCombustible,
  TODOS_VEHICULOS_REQUISICION,
} from "../requisiciones/lib/helpers";
import { SolicitudesCombustiblePanel } from "./SolicitudesCombustiblePanel";
import { CrearSolicitudCombustible } from "./forms/Crear";
import { ResolverSolicitudCombustibleModal } from "./forms/ResolverModal";
import { useSolicitudesCombustible } from "./lib/hooks";
import type { SolicitudCombustibleRow } from "./lib/zod";

const TABS = ["TODAS", "PENDIENTES", "RECHAZADAS"] as const;
type TabSolicitudCombustible = (typeof TABS)[number];

const TAB_OPTIONS = TABS.map((tab) => ({
  value: tab,
  label:
    tab === "TODAS" ? "Todas" : tab === "PENDIENTES" ? "Pendientes" : "Rechazadas",
}));

const filtroTriggerClass = cn(
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
);

const filtroContentClass =
  "z-[200] max-h-60 border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

const filtroItemClass =
  "cursor-pointer rounded-lg bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800";

export function SolicitudesCombustible() {
  const filtrosMontados = useGvClientMounted();
  const gvRole = useGvPermissionRole();
  const canResolver = canAprobarRechazarSolicitudCombustible(gvRole);
  const canExport = canExportCombustibleExcel(gvRole);
  const { data: solicitudes = [], isLoading } = useSolicitudesCombustible();
  const { data: vehiculosFlota = [] } = useVehiculos();
  const vehiculosCatalogoFlota = useMemo(
    () => listarVehiculosCatalogoFlota(vehiculosFlota),
    [vehiculosFlota],
  );

  const [tabActiva, setTabActiva] = useState<TabSolicitudCombustible>("TODAS");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);
  const [vehiculoFilter, setVehiculoFilter] = useState(TODOS_VEHICULOS_REQUISICION);
  const [formOpen, setFormOpen] = useState(false);
  const [resolverOpen, setResolverOpen] = useState(false);
  const [selected, setSelected] = useState<SolicitudCombustibleRow | null>(null);
  const [accion, setAccion] = useState<"APROBAR" | "RECHAZAR" | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  useEffect(() => {
    if (vehiculoFilter === TODOS_VEHICULOS_REQUISICION) return;
    if (!vehiculosCatalogoFlota.some((v) => v.id === vehiculoFilter)) {
      setVehiculoFilter(TODOS_VEHICULOS_REQUISICION);
    }
  }, [vehiculoFilter, vehiculosCatalogoFlota]);

  const requisicionesAprobadas = useMemo(
    () => filtrarRequisicionesCombustible(solicitudes, vehiculoFilter, periodoFilter),
    [solicitudes, vehiculoFilter, periodoFilter],
  );

  const solicitudesFiltradas = useMemo(() => {
    const porPeriodoYVehiculo = filtrarSolicitudesCombustible(
      solicitudes,
      periodoFilter,
      vehiculoFilter,
    );
    return porPeriodoYVehiculo.filter((row) => {
      if (tabActiva === "TODAS") return true;
      if (tabActiva === "PENDIENTES") return row.estado === "PENDIENTE";
      if (tabActiva === "RECHAZADAS") return row.estado === "RECHAZADO";
      return true;
    });
  }, [solicitudes, tabActiva, periodoFilter, vehiculoFilter]);

  const paginacionKey = `${tabActiva}|${periodoFilter}|${vehiculoFilter}`;

  const {
    pageItems,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(solicitudesFiltradas, paginacionKey);

  const handleTabChange = (tab: TabSolicitudCombustible) => {
    setTabActiva(tab);
    setPage(1);
  };

  const handleResolver = (row: SolicitudCombustibleRow, next: "APROBAR" | "RECHAZAR") => {
    setSelected(row);
    setAccion(next);
    setResolverOpen(true);
  };

  const handleExportExcel = async (row: SolicitudCombustibleRow) => {
    setExportingId(row.id);
    try {
      const { exportRequisicionCombustibleExcel } = await import(
        "../requisiciones/lib/requisicion-combustible-excel"
      );
      const result = await exportRequisicionCombustibleExcel(row);
      if (!result.ok) {
        if (result.reason === "not_approved") {
          toast.warn("Solo se puede exportar una requisición aprobada.");
        } else {
          toast.error("No se pudo generar el Excel.");
        }
        return;
      }
      toast.success("Excel descargado.");
    } catch {
      toast.error("No se pudo generar el Excel.");
    } finally {
      setExportingId(null);
    }
  };

  const handleExportAllExcel = async () => {
    if (requisicionesAprobadas.length === 0) {
      toast.warn("No hay requisiciones aprobadas para exportar con los filtros actuales.");
      return;
    }

    setExportingAll(true);
    try {
      const { exportRequisicionesCombustibleExcel } = await import(
        "../requisiciones/lib/requisicion-combustible-excel"
      );

      const vehiculoSeleccionado =
        vehiculoFilter !== TODOS_VEHICULOS_REQUISICION
          ? vehiculosCatalogoFlota.find((v) => v.id === vehiculoFilter)
          : undefined;
      const filenameSuffix = vehiculoSeleccionado?.placa?.trim() || undefined;

      const result = await exportRequisicionesCombustibleExcel(requisicionesAprobadas, {
        filenameSuffix,
      });

      if (!result.ok) {
        if (result.reason === "no_data") {
          toast.warn("No hay requisiciones para exportar.");
        } else {
          toast.error("No se pudo generar el Excel.");
        }
        return;
      }
      toast.success("Excel descargado.");
    } catch {
      toast.error("No se pudo generar el Excel.");
    } finally {
      setExportingAll(false);
    }
  };

  const handlePeriodoChange = (value: string) => {
    setPeriodoFilter(value);
    setPage(1);
  };

  const handleVehiculoChange = (value: string) => {
    setVehiculoFilter(value);
    setPage(1);
  };

  const vehiculoFiltroLabel = useMemo(() => {
    if (vehiculoFilter === TODOS_VEHICULOS_REQUISICION) return "Todos los vehículos";
    const vehiculo = vehiculosCatalogoFlota.find((v) => v.id === vehiculoFilter);
    return vehiculo ? formatVehiculoOpcion(vehiculo) : "Todos los vehículos";
  }, [vehiculoFilter, vehiculosCatalogoFlota]);

  const vehiculoSelect = filtrosMontados ? (
    <Select value={vehiculoFilter} onValueChange={handleVehiculoChange}>
      <SelectTrigger className={cn(filtroTriggerClass, "gap-2")} data-morph-hover-scope>
        <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <GvMorphIcon
            icon={Car}
            hoverIcon={CarFront}
            size={16}
            className="shrink-0 text-celeste-trifinio"
          />
          <SelectValue placeholder="Todos los vehículos" />
        </span>
      </SelectTrigger>
      <SelectContent position="popper" className={filtroContentClass}>
        <SelectItem
          value={TODOS_VEHICULOS_REQUISICION}
          textValue="Todos los vehículos"
          className={filtroItemClass}
        >
          Todos los vehículos
        </SelectItem>
        {vehiculosCatalogoFlota.map((v) => {
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
  ) : (
    <div
      className={cn(filtroTriggerClass, "flex items-center gap-2")}
      aria-hidden
    >
      <GvMorphIcon
        icon={Car}
        hoverIcon={CarFront}
        size={16}
        className="shrink-0 text-celeste-trifinio"
      />
      <span className="min-w-0 truncate">{vehiculoFiltroLabel}</span>
    </div>
  );

  return (
    <>
      <CrearSolicitudCombustible open={formOpen} onOpenChange={setFormOpen} />
      <ResolverSolicitudCombustibleModal
        open={resolverOpen}
        onOpenChange={setResolverOpen}
        solicitud={selected}
        accion={accion}
      />

      <GestionVehiculosTableShell
        visibleRows={gvTableShellVisibleRows(pageSize)}
        toolbar={
          <div className={GV_TABLE_TOOLBAR_ROW_CLASS}>
            <div className={GV_TABLE_TOOLBAR_PRIMARY_CLASS}>
              <GvTabFilter
                value={tabActiva}
                onChange={handleTabChange}
                options={TAB_OPTIONS}
                layoutId="combustible-solicitudes-tabs"
                compact
                className="min-w-0 w-full flex-1 lg:w-auto"
              />
              <div className="min-w-0 w-full lg:min-w-[12rem] lg:max-w-[min(26rem,32vw)]">
                {vehiculoSelect}
              </div>
              <GvMonthPicker
                value={periodoFilter}
                onChange={handlePeriodoChange}
                className="!h-11 min-w-0 w-full shrink-0 text-xs sm:w-[10.5rem] lg:hidden"
              />
            </div>
            <div className={GV_TABLE_TOOLBAR_ACTIONS_CLASS}>
              <GvMonthPicker
                value={periodoFilter}
                onChange={handlePeriodoChange}
                className="hidden lg:inline-flex"
              />
              {canExport ? (
                <GvExportReporteButton
                  onClick={() => void handleExportAllExcel()}
                  disabled={isLoading || requisicionesAprobadas.length === 0}
                  loading={exportingAll}
                />
              ) : null}
              <GvSigetActionButton
                label="Solicitar"
                accentColor={sigetAccent.crear}
                morphFrom={Plus}
                morphTo={CirclePlus}
                onClick={() => setFormOpen(true)}
                ariaLabel="Nueva solicitud de combustible"
                className="h-11 w-auto shrink-0 rounded-xl px-4"
              />
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
            <span className="inline-flex animate-spin text-celeste-trifinio">
              <GvMorphIcon icon={Loader2} size={32} morphOnHover={false} />
            </span>
          </div>
        ) : (
          <SolicitudesCombustiblePanel
            solicitudes={pageItems}
            catalogo={solicitudesFiltradas}
            canResolver={canResolver}
            canExport={canExport}
            onResolver={handleResolver}
            exportingId={exportingId}
            onExportExcel={canExport ? (row) => void handleExportExcel(row) : undefined}
          />
        )}
      </GestionVehiculosTableShell>
    </>
  );
}
