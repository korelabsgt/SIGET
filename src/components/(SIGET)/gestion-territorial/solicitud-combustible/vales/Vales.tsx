"use client";

import { useState } from "react";
import { CirclePlus, Loader2, Plus } from "lucide";

import { GvMorphIcon } from "../../gestion-vehiculos/lib/morph-icon";

import {
  GestionVehiculosTableShell,
  GV_TABLE_BODY_CENTER_CLASS,
  gvTableShellVisibleRows,
} from "../../gestion-vehiculos/lib/table-ui";
import { useGvTablePagination } from "../../gestion-vehiculos/lib/table-pagination";
import { GvSigetActionButton, sigetAccent } from "../../gestion-vehiculos/lib/gv-siget-action-button";
import { useGvPermissionRole } from "../../gestion-vehiculos/lib/gv-permissions-hook";
import {
  canDeleteValeCombustible,
  canManageValesCombustible,
} from "../lib/permissions";

import { ValesPanel } from "./ValesPanel";
import { CrearVale } from "./forms/CrearVale";
import { useValesCombustible } from "./lib/hooks";
export function Vales() {
  const gvRole = useGvPermissionRole();
  const canAdmin = canManageValesCombustible(gvRole);
  const canDelete = canDeleteValeCombustible(gvRole);
  const { data: vales = [], isLoading } = useValesCombustible();
  const [formOpen, setFormOpen] = useState(false);

  const {
    pageItems,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(vales, "vales-combustible");

  return (
    <>
      <CrearVale open={formOpen} onOpenChange={setFormOpen} />

      <GestionVehiculosTableShell
        visibleRows={gvTableShellVisibleRows(pageSize)}
        toolbar={
          canAdmin ? (
            <div className="flex w-full min-w-0 justify-end">
              <GvSigetActionButton
                label="Registrar"
                accentColor={sigetAccent.crear}
                morphFrom={Plus}
                morphTo={CirclePlus}
                onClick={() => setFormOpen(true)}
                ariaLabel="Registrar lote de vales"
                className="h-11 w-auto shrink-0 rounded-xl px-4"
              />
            </div>
          ) : undefined
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
          <ValesPanel vales={pageItems} canDelete={canDelete} />
        )}
      </GestionVehiculosTableShell>
    </>
  );
}
