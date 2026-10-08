"use client";

import { useMemo, useState } from "react";
import { CirclePlus, Loader2, Plus, ScanSearch, Search } from "lucide";

import { GvMorphIcon } from "../../gestion-vehiculos/lib/morph-icon";

import {
  GestionVehiculosTableShell,
  GV_TABLE_BODY_CENTER_CLASS,
  GV_TABLE_RECORD_SCROLL,
} from "../../gestion-vehiculos/lib/table-ui";
import {
  GV_TABLE_SEARCH_INPUT_CLASS,
  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
  GV_TABLE_TOOLBAR_ACTIONS_PAIR_CLASS,
  GV_TABLE_TOOLBAR_PRIMARY_CLASS,
  GV_TABLE_TOOLBAR_ROW_CLASS,
} from "../../gestion-vehiculos/lib/gv-header-ui";
import { GvToolbarSelect } from "../../gestion-vehiculos/lib/gv-toolbar-select";
import { useGvTablePagination } from "../../gestion-vehiculos/lib/table-pagination";
import { GvSigetActionButton, sigetAccent } from "../../gestion-vehiculos/lib/gv-siget-action-button";
import { GvExportReporteButton } from "../../gestion-vehiculos/lib/gv-export-ui";
import { GV_PANEL_STACK_CLASS } from "../../gestion-vehiculos/lib/page-shell";
import { cn } from "@/lib/utils";
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
import { valeLoteCoincideBusqueda } from "./lib/helpers";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const valesPorFondo = useMemo(
    () => vales.filter((row) => row.fondo === fondoTab),
    [vales, fondoTab],
  );

  const valesFiltrados = useMemo(
    () => valesPorFondo.filter((row) => valeLoteCoincideBusqueda(row, searchQuery)),
    [valesPorFondo, searchQuery],
  );

  const paginacionKey = `vales-combustible-${fondoTab}|${searchQuery}`;

  const {
    pageItems,
    pageSafe,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  } = useGvTablePagination(valesFiltrados, paginacionKey);

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

      <div className={GV_PANEL_STACK_CLASS}>
      <GestionVehiculosTableShell
        visibleRows={GV_TABLE_RECORD_SCROLL}
        toolbar={
          <div className={cn(GV_TABLE_TOOLBAR_ROW_CLASS, "lg:gap-2")}>
            <div className={cn(GV_TABLE_TOOLBAR_PRIMARY_CLASS, "max-lg:flex-col max-lg:items-stretch")}>
              <div className="relative min-w-0 w-full lg:flex-1" data-morph-hover-scope>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-celeste-trifinio">
                  <GvMorphIcon icon={Search} hoverIcon={ScanSearch} size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar denominación, cupón o disponibles..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className={cn(GV_TABLE_SEARCH_INPUT_CLASS, "pl-10")}
                />
              </div>
            </div>
            <div
              className={cn(
                GV_TABLE_TOOLBAR_ACTIONS_CLASS,
                GV_TABLE_TOOLBAR_ACTIONS_PAIR_CLASS,
                "min-w-0 w-full max-lg:col-span-full max-lg:justify-end",
                "lg:inline-flex lg:w-auto lg:max-w-none lg:flex-nowrap lg:justify-end lg:gap-1.5 lg:[&>*]:w-auto",
              )}
            >
              <GvToolbarSelect
                value={fondoTab}
                onChange={(fondo) => {
                  setFondoTab(fondo);
                  setPage(1);
                }}
                ariaLabel="Filtrar vales por fondo"
                className="w-full max-lg:col-span-2 max-lg:max-w-none lg:w-auto lg:min-w-0 lg:max-w-[6.75rem]"
                triggerClassName="gap-1.5 px-2.5"
                options={FONDOS_COMBUSTIBLE.map((fondo) => ({
                  value: fondo,
                  label: FONDO_TAB_LABELS[fondo],
                }))}
              />
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
                  className="h-11 w-auto max-lg:h-11 max-lg:w-full shrink-0 rounded-xl px-4"
                />
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
      </div>
    </>
  );
}
