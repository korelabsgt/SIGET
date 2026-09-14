"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import {
  GestionVehiculosTableShell,
  GV_TABLE_BODY_CENTER_CLASS,
  gvTableShellVisibleRows,
} from "../../gestion-vehiculos/lib/table-ui";
import { GvTabFilter } from "../../gestion-vehiculos/lib/gv-tab-filter";
import { GV_HEADER_OUTLINE_BUTTON_CLASS } from "../../gestion-vehiculos/lib/gv-header-ui";
import { useGvTablePagination } from "../../gestion-vehiculos/lib/table-pagination";
import { cn } from "@/lib/utils";
import { useGvPermissionRole } from "../../gestion-vehiculos/lib/gv-permissions-hook";
import { canManageCombustibleAdmin } from "../lib/permissions";

import { SolicitudesCombustibleList } from "./SolicitudesCombustibleList";
import { CrearSolicitudCombustible } from "./forms/Crear";
import { ResolverSolicitudCombustibleModal } from "./forms/ResolverModal";
import { useSolicitudesCombustible } from "./lib/hooks";
import type { SolicitudCombustibleRow } from "./lib/zod";

const TABS = ["TODAS", "PENDIENTES", "APROBADAS", "RECHAZADAS"] as const;
type TabSolicitudCombustible = (typeof TABS)[number];

const TAB_OPTIONS = TABS.map((tab) => ({
  value: tab,
  label:
    tab === "TODAS"
      ? "Todas"
      : tab === "PENDIENTES"
        ? "Pendientes"
        : tab === "APROBADAS"
          ? "Aprobadas"
          : "Rechazadas",
}));

export function SolicitudesCombustible() {
  const gvRole = useGvPermissionRole();
  const canAdmin = canManageCombustibleAdmin(gvRole);
  const { data: solicitudes = [], isLoading } = useSolicitudesCombustible();

  const [tabActiva, setTabActiva] = useState<TabSolicitudCombustible>("TODAS");
  const [formOpen, setFormOpen] = useState(false);
  const [resolverOpen, setResolverOpen] = useState(false);
  const [selected, setSelected] = useState<SolicitudCombustibleRow | null>(null);
  const [accion, setAccion] = useState<"APROBAR" | "RECHAZAR" | null>(null);

  const filtradas = useMemo(() => {
    return solicitudes.filter((row) => {
      if (tabActiva === "TODAS") return true;
      if (tabActiva === "PENDIENTES") return row.estado === "PENDIENTE";
      if (tabActiva === "APROBADAS") return row.estado === "APROBADO";
      if (tabActiva === "RECHAZADAS") return row.estado === "RECHAZADO";
      return true;
    });
  }, [solicitudes, tabActiva]);

  const paginacionKey = tabActiva;
  const {
    pageItems,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(filtradas, paginacionKey);

  const pendientes = solicitudes.filter((row) => row.estado === "PENDIENTE").length;

  const handleResolver = (row: SolicitudCombustibleRow, next: "APROBAR" | "RECHAZAR") => {
    setSelected(row);
    setAccion(next);
    setResolverOpen(true);
  };

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
          <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <GvTabFilter
                value={tabActiva}
                onChange={setTabActiva}
                options={TAB_OPTIONS}
                layoutId="combustible-solicitudes-tabs"
                fill
              />
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {canAdmin ? (
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {pendientes} pendiente(s)
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className={cn(GV_HEADER_OUTLINE_BUTTON_CLASS, "w-auto shrink-0")}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Solicitar</span>
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
        {isLoading ? (
          <div className={GV_TABLE_BODY_CENTER_CLASS}>
            <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
          </div>
        ) : (
          <SolicitudesCombustibleList
            solicitudes={pageItems}
            canResolver={canAdmin}
            onResolver={handleResolver}
          />
        )}
      </GestionVehiculosTableShell>
    </>
  );
}
