"use client";

import { useState } from "react";
import { CirclePlus, Loader2, Plus } from "lucide";
import { toast } from "react-toastify";

import { GvMorphIcon } from "../../gestion-vehiculos/lib/morph-icon";

import {
  GestionVehiculosTableShell,
  GV_TABLE_BODY_CENTER_CLASS,
  gvTableShellVisibleRows,
} from "../../gestion-vehiculos/lib/table-ui";
import { useGvTablePagination } from "../../gestion-vehiculos/lib/table-pagination";
import { GvSigetActionButton, sigetAccent } from "../../gestion-vehiculos/lib/gv-siget-action-button";
import { GvExportReporteButton } from "../../gestion-vehiculos/lib/gv-export-ui";
import { useGvPermissionRole } from "../../gestion-vehiculos/lib/gv-permissions-hook";
import {
  canDeleteValeCombustible,
  canExportCombustibleExcel,
  canManageValesCombustible,
} from "../lib/permissions";
import { useSolicitudesCombustible } from "../solicitudes/lib/hooks";

import { ValesPanel } from "./ValesPanel";
import { CrearVale } from "./forms/CrearVale";
import { useValesCombustible } from "./lib/hooks";
export function Vales() {
  const gvRole = useGvPermissionRole();
  const canAdmin = canManageValesCombustible(gvRole);
  const canDelete = canDeleteValeCombustible(gvRole);
  const canExport = canExportCombustibleExcel(gvRole);
  const { data: vales = [], isLoading } = useValesCombustible();
  const { data: solicitudes = [], isLoading: loadingSolicitudes } =
    useSolicitudesCombustible();
  const [formOpen, setFormOpen] = useState(false);
  const [exportandoCuenta, setExportandoCuenta] = useState(false);

  const {
    pageItems,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(vales, "vales-combustible");

  const handleExportCuentaCorriente = async () => {
    setExportandoCuenta(true);
    try {
      const { exportCuentaCorrienteCuponesExcel } = await import(
        "./lib/cuenta-corriente-cupones-excel"
      );
      const result = await exportCuentaCorrienteCuponesExcel(vales, solicitudes);
      if (!result.ok) {
        if (result.reason === "no_data") {
          toast.warn("No hay ingresos ni egresos para generar la cuenta corriente.");
        } else {
          toast.error("No se pudo generar el Excel.");
        }
        return;
      }
      toast.success("Cuenta corriente descargada.");
    } catch {
      toast.error("No se pudo generar el Excel.");
    } finally {
      setExportandoCuenta(false);
    }
  };

  return (
    <>
      <CrearVale open={formOpen} onOpenChange={setFormOpen} />

      <GestionVehiculosTableShell
        visibleRows={gvTableShellVisibleRows(pageSize)}
        toolbar={
          canAdmin || canExport ? (
            <div className="flex w-full min-w-0 justify-end gap-2">
              {canExport ? (
                <GvExportReporteButton
                  onClick={() => void handleExportCuentaCorriente()}
                  disabled={isLoading || loadingSolicitudes || vales.length === 0}
                  loading={exportandoCuenta}
                />
              ) : null}
              {canAdmin ? (
                <GvSigetActionButton
                  label="Registrar"
                  accentColor={sigetAccent.crear}
                  morphFrom={Plus}
                  morphTo={CirclePlus}
                  onClick={() => setFormOpen(true)}
                  ariaLabel="Registrar lote de vales"
                  className="h-11 w-auto shrink-0 rounded-xl px-4"
                />
              ) : null}
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
