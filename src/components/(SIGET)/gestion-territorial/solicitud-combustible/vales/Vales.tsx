"use client";

import { useMemo, useState } from "react";
import { CirclePlus, Loader2, Plus } from "lucide";

import { GvMorphIcon } from "../../gestion-vehiculos/lib/morph-icon";

import {
  GestionVehiculosTableShell,
  GV_TABLE_BODY_CENTER_CLASS,
  gvTableShellVisibleRows,
} from "../../gestion-vehiculos/lib/table-ui";
import {
  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
  GV_TABLE_TOOLBAR_PRIMARY_CLASS,
  GV_TABLE_TOOLBAR_ROW_CLASS,
} from "../../gestion-vehiculos/lib/gv-header-ui";
import { GvTabFilter } from "../../gestion-vehiculos/lib/gv-tab-filter";
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
import { ExportCuentaCorrienteModal } from "./forms/ExportCuentaCorrienteModal";
import { useValesCombustible } from "./lib/hooks";
import { FONDOS_COMBUSTIBLE, type FondoCombustible } from "./lib/zod";

const FONDO_TAB_LABELS: Record<FondoCombustible, string> = {
  OT: "OT",
  HAME: "HAME",
};

export function Vales() {
  const gvRole = useGvPermissionRole();
  const canAdmin = canManageValesCombustible(gvRole);
  const canDelete = canDeleteValeCombustible(gvRole);
  const canExport = canExportCombustibleExcel(gvRole);
  const { data: vales = [], isLoading } = useValesCombustible();
  const { data: solicitudes = [], isLoading: loadingSolicitudes } =
    useSolicitudesCombustible();
  const [fondoTab, setFondoTab] = useState<FondoCombustible>("OT");
  const [formOpen, setFormOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const valesPorFondo = useMemo(
    () => vales.filter((row) => row.fondo === fondoTab),
    [vales, fondoTab],
  );

  const paginacionKey = `vales-combustible-${fondoTab}`;

  const {
    pageItems,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(valesPorFondo, paginacionKey);

  return (
    <>
      <CrearVale
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultFondo={fondoTab}
      />

      <ExportCuentaCorrienteModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        fondo={fondoTab}
        lotes={valesPorFondo}
        valesInventario={vales}
        solicitudes={solicitudes}
      />

      <GestionVehiculosTableShell
        visibleRows={gvTableShellVisibleRows(pageSize)}
        toolbar={
          <div className={GV_TABLE_TOOLBAR_ROW_CLASS}>
            <div className={GV_TABLE_TOOLBAR_PRIMARY_CLASS}>
              <GvTabFilter
                value={fondoTab}
                onChange={setFondoTab}
                layoutId="combustible-vales-fondo"
                layout="responsive-grid"
                fill
                compact
                className="min-w-0 w-full flex-1 lg:w-auto"
                options={FONDOS_COMBUSTIBLE.map((fondo) => ({
                  value: fondo,
                  label: FONDO_TAB_LABELS[fondo],
                }))}
              />
            </div>

            {canAdmin || canExport ? (
              <div className={GV_TABLE_TOOLBAR_ACTIONS_CLASS}>
                {canExport ? (
                  <GvExportReporteButton
                    onClick={() => setExportModalOpen(true)}
                    disabled={isLoading || loadingSolicitudes || valesPorFondo.length === 0}
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
            <span className="inline-flex animate-spin text-celeste-trifinio">
              <GvMorphIcon icon={Loader2} size={32} morphOnHover={false} />
            </span>
          </div>
        ) : (
          <ValesPanel
            vales={pageItems}
            canDelete={canDelete}
            fondoActivo={fondoTab}
          />
        )}
      </GestionVehiculosTableShell>
    </>
  );
}
