"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import {
  GestionVehiculosTableShell,
  GV_TABLE_BODY_CENTER_CLASS,
  gvTableShellVisibleRows,
} from "../../gestion-vehiculos/lib/table-ui";
import { GV_HEADER_OUTLINE_BUTTON_CLASS } from "../../gestion-vehiculos/lib/gv-header-ui";
import { useGvTablePagination } from "../../gestion-vehiculos/lib/table-pagination";
import { cn } from "@/lib/utils";
import { useGvPermissionRole } from "../../gestion-vehiculos/lib/gv-permissions-hook";
import { canManageCombustibleAdmin } from "../lib/permissions";

import { RequisicionesList } from "./RequisicionesList";
import { CrearRequisicion } from "./forms/Crear";
import { useRequisicionesCombustible } from "./lib/hooks";
import { cuponesDisponiblesRequisicion } from "./lib/helpers";

export function Requisiciones() {
  const gvRole = useGvPermissionRole();
  const canAdmin = canManageCombustibleAdmin(gvRole);
  const { data: requisiciones = [], isLoading } = useRequisicionesCombustible();
  const [formOpen, setFormOpen] = useState(false);

  const {
    pageItems,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(requisiciones, "requisiciones-combustible");

  const totalDisponibles = useMemo(
    () => requisiciones.reduce((acc, row) => acc + cuponesDisponiblesRequisicion(row), 0),
    [requisiciones],
  );

  return (
    <>
      <CrearRequisicion open={formOpen} onOpenChange={setFormOpen} />

      <GestionVehiculosTableShell
        visibleRows={gvTableShellVisibleRows(pageSize)}
        toolbar={
          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-muted-foreground">
              {requisiciones.length} lote(s) · {totalDisponibles} cupón(es) disponibles
            </p>
            {canAdmin ? (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className={cn(GV_HEADER_OUTLINE_BUTTON_CLASS, "w-auto shrink-0 self-end")}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Registrar lote</span>
              </button>
            ) : null}
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
          <RequisicionesList requisiciones={pageItems} canDelete={canAdmin} />
        )}
      </GestionVehiculosTableShell>
    </>
  );
}
