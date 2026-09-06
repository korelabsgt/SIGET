"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Car, CarFront, Check, Loader2, Plus, ScanSearch, Search, FileSpreadsheet, ArrowDownToLine } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { GvMorphIcon } from "../lib/morph-icon";
import { showToast } from "@/lib/notifications";
import { confirmDestructivo } from "@/lib/confirm-destructivo";

import { VehiculosPanel } from "./VehiculosPanel";
import { FlotaNotificaciones } from "./FlotaNotificaciones";
import { VehiculoGaleriaModal } from "./VehiculoGaleriaModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEliminarVehiculo, useVehiculos } from "./lib/hooks";
import { type VehiculoRow, ESTADOS_VEHICULO } from "./lib/zod";
import { cn } from "@/lib/utils";
import { GV_FILTRO_FIELD_CLASS, GV_HEADER_OUTLINE_BUTTON_CLASS, GV_TABLE_SEARCH_INPUT_CLASS, GV_TABLE_TOOLBAR_ACTIONS_CLASS, GV_TABLE_TOOLBAR_PRIMARY_CLASS, GV_TABLE_TOOLBAR_ROW_CLASS, GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS } from "../lib/gv-header-ui";
import { GestionVehiculosTableEmpty, GestionVehiculosTableShell, GV_TABLE_BODY_CENTER_CLASS, gvTableShellVisibleRows } from "../lib/table-ui";
import { useGvTablePagination } from "../lib/table-pagination";
import { useGvPanelChrome, GvHeaderExtras } from "../lib/gv-page-chrome";
import { GvTableSectionMotion } from "../lib/gv-table-motion";
import { useGvPermissionRole } from "../lib/gv-permissions-hook";
import { canManageFlota } from "../lib/permissions";

const Crear = dynamic(() => import("./forms/Crear").then((m) => m.Crear));
const VerEditar = dynamic(() => import("./forms/VerEditar").then((m) => m.VerEditar));

const TODOS = "__todos__";

const ESTADO_VEHICULO_LABELS: Record<(typeof ESTADOS_VEHICULO)[number], string> = {
  LIBRE: "Libre",
  RESERVADO: "Reservado",
  EN_MANTENIMIENTO: "Mantenimiento",
};

const filtroEstadoTriggerClass = cn(
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
  "cursor-pointer px-3 data-[size=default]:h-11 focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25",
);

const filtroEstadoContentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

const filtroEstadoItemClass =
  "cursor-pointer rounded-lg bg-white font-medium capitalize text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800";

export function Flota() {
  const gvRole = useGvPermissionRole();
  const canManage = canManageFlota(gvRole);
  const { data: vehiculos = [], isLoading: loading, error: queryError, refetch } = useVehiculos();
  const eliminar = useEliminarVehiculo();

  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState(TODOS);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<VehiculoRow | null>(null);
  const [galeriaVehiculo, setGaleriaVehiculo] = useState<VehiculoRow | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingVehiculoId, setExportingVehiculoId] = useState<string | null>(null);

  const error = queryError instanceof Error ? queryError.message : queryError ? "Error al cargar" : null;

  const vehiculosFiltrados = useMemo(() => {
    const filtrados = vehiculos.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        v.placa.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q);
      const matchEstado = estadoFilter === TODOS || v.estado === estadoFilter;
      return matchSearch && matchEstado;
    });

    return filtrados.sort((a, b) => {
      const ordenA = ESTADOS_VEHICULO.indexOf(a.estado);
      const ordenB = ESTADOS_VEHICULO.indexOf(b.estado);
      if (ordenA !== ordenB) return ordenA - ordenB;
      return a.placa.localeCompare(b.placa, "es");
    });
  }, [vehiculos, searchQuery, estadoFilter]);

  const paginacionKey = `${searchQuery}|${estadoFilter}`;
  const {
    pageItems: vehiculosPaginados,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
    rowOffset,
  } = useGvTablePagination(vehiculosFiltrados, paginacionKey);

  const tableVisibleRows = gvTableShellVisibleRows(pageSize);

  const handleEdit = (v: VehiculoRow) => {
    setEditingVehiculo(v);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingVehiculo(null);
    setIsModalOpen(true);
  };

  useGvPanelChrome("flota");

  const handleExportExcel = async () => {
    if (vehiculosFiltrados.length === 0) {
      showToast("warning", "No hay vehículos para exportar con los filtros actuales.");
      return;
    }

    setIsExporting(true);
    try {
      const { exportFlotaExcel } = await import("./lib/flota-excel");
      const result = await exportFlotaExcel(vehiculosFiltrados);
      if (!result.ok) {
        showToast("warning", "No hay vehículos para exportar.");
        return;
      }
      showToast("success", "Excel descargado.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo exportar el Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportVehiculo = async (vehiculo: VehiculoRow) => {
    const vehiculoId = vehiculo.id ?? vehiculo.placa;
    setExportingVehiculoId(vehiculoId);
    try {
      const { exportVehiculoExcel } = await import("./lib/flota-excel");
      const result = await exportVehiculoExcel(vehiculo);
      if (!result.ok) {
        showToast("warning", "No se pudo exportar el vehículo.");
        return;
      }
      showToast("success", "Excel descargado.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo exportar el Excel.");
    } finally {
      setExportingVehiculoId(null);
    }
  };

  const handleDelete = async (v: VehiculoRow): Promise<boolean> => {
    const result = await confirmDestructivo({
      title: "¿Eliminar vehículo?",
      text: `¿Está seguro que desea eliminar el vehículo con placa ${v.placa}?`,
      confirmButtonText: "Sí, eliminar",
    });

    if (!result.isConfirmed) return false;

    try {
      await eliminar.mutateAsync(v.id!);
      showToast("success", "Vehículo eliminado");
      return true;
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Error al eliminar",
      );
      return false;
    }
  };

  return (
    <>
      <GvHeaderExtras panelId="flota">
        {!loading ? <FlotaNotificaciones vehiculos={vehiculos} /> : null}
      </GvHeaderExtras>
      <GvTableSectionMotion panelId="flota">
        <GestionVehiculosTableShell
          visibleRows={tableVisibleRows}
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
          toolbar={
            <div className={GV_TABLE_TOOLBAR_ROW_CLASS}>
              <div className={GV_TABLE_TOOLBAR_PRIMARY_CLASS}>
                <div className="relative min-w-0 w-full flex-1" data-morph-hover-scope>
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-celeste-trifinio">
                    <GvMorphIcon icon={Search} hoverIcon={ScanSearch} size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por placa, marca o modelo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(GV_TABLE_SEARCH_INPUT_CLASS, "pl-10")}
                  />
                </div>
                <div className="min-w-0 w-full flex-1 lg:max-w-[14rem] lg:shrink-0">
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className={filtroEstadoTriggerClass}>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent position="popper" className={filtroEstadoContentClass}>
                      <SelectItem value={TODOS} textValue="Todos los estados" className={filtroEstadoItemClass}>
                        Todos los estados
                      </SelectItem>
                      {ESTADOS_VEHICULO.map((est) => (
                        <SelectItem
                          key={est}
                          value={est}
                          textValue={ESTADO_VEHICULO_LABELS[est]}
                          className={filtroEstadoItemClass}
                        >
                          {ESTADO_VEHICULO_LABELS[est]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={cn(GV_TABLE_TOOLBAR_ACTIONS_CLASS, "max-lg:justify-end")}>
                {vehiculosFiltrados.length > 0 ? (
                  <SigetActionButton
                    label="Excel"
                    accentColor={sigetAccent.excel}
                    morphFrom={FileSpreadsheet}
                    morphTo={ArrowDownToLine}
                    onClick={() => void handleExportExcel()}
                    disabled={isExporting || loading}
                    ariaLabel="Descargar Excel"
                    className="h-11 w-auto shrink-0 rounded-xl px-4"
                  />
                ) : null}
                {canManage ? (
                  <button
                    type="button"
                    onClick={handleCreate}
                    className={GV_HEADER_OUTLINE_BUTTON_CLASS}
                  >
                    <GvMorphIcon icon={Plus} hoverIcon={Check} size={16} />
                    Añadir
                  </button>
                ) : null}
              </div>
            </div>
          }
        >
          {loading ? (
            <div className={GV_TABLE_BODY_CENTER_CLASS}>
              <span className="inline-flex animate-spin text-celeste-trifinio">
                <GvMorphIcon icon={Loader2} size={32} morphOnHover={false} />
              </span>
            </div>
          ) : error ? (
            <p className={cn(GV_TABLE_BODY_CENTER_CLASS, "text-sm text-red-500")}>{error}</p>
          ) : vehiculosFiltrados.length === 0 ? (
            <GestionVehiculosTableEmpty
              icon={<GvMorphIcon icon={Car} hoverIcon={CarFront} size={40} />}
              title={
                searchQuery.trim() || estadoFilter !== TODOS
                  ? "Sin coincidencias"
                  : "Sin vehículos"
              }
              description={
                searchQuery.trim() || estadoFilter !== TODOS
                  ? "Prueba con otra placa, marca o estado."
                  : "Añade el primer vehículo de la flota."
              }
            />
          ) : (
            <VehiculosPanel
              vehiculos={vehiculosPaginados}
              rowOffset={rowOffset}
              onEdit={handleEdit}
              onOpenGaleria={setGaleriaVehiculo}
              onExportExcel={(vehiculo) => void handleExportVehiculo(vehiculo)}
              exportingVehiculoId={exportingVehiculoId}
              onDelete={handleDelete}
              canManage={canManage}
            />
          )}
        </GestionVehiculosTableShell>
      </GvTableSectionMotion>

      <VehiculoGaleriaModal
        open={galeriaVehiculo !== null}
        onClose={() => setGaleriaVehiculo(null)}
        vehiculo={galeriaVehiculo}
      />

      {isModalOpen && editingVehiculo ? (
        <VerEditar
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          initialData={editingVehiculo}
          onSaved={() => {
            void refetch();
          }}
        />
      ) : null}
      {isModalOpen && !editingVehiculo ? (
        <Crear
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSaved={() => {
            void refetch();
          }}
        />
      ) : null}
    </>
  );
}
