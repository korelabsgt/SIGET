"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Loader2, ChevronLeft } from "lucide-react";

import { SubmodulosNav } from "../../SubmodulosNav";
import { BitacorasList } from "./BitacorasList";
import { BitacoraStatsCards } from "./BitacoraStatsCards";
import { Crear } from "./forms/Crear";
import { ExportarReporteModal } from "./ExportarReporteModal";
import { useBitacoras, useMetricasBitacoras } from "./lib/hooks";
import { GestionVehiculosTableShell } from "../lib/table-ui";

export function Bitacoras() {
  const router = useRouter();
  const { data: bitacoras = [], isLoading: loadingBitacoras } = useBitacoras();
  const { data: metricas = { total_km: 0, total_combustible: 0, total_misiones: 0 } } = useMetricasBitacoras();
  const [modalOpen, setModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const loading = loadingBitacoras;

  return (
    <div className="mx-auto w-full px-0 pt-6 pb-20 sm:px-6 md:pt-10 lg:px-8 xl:w-[90%] relative">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />

      <SubmodulosNav />

      <div className="mb-6 flex flex-col gap-4 px-3 sm:flex-row sm:items-start sm:justify-between sm:px-0">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-emerald-300 bg-transparent px-4 text-xs font-bold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            Exportar Reporte
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-celeste-trifinio px-5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Registrar Viaje
          </button>
        </div>
      </div>

      <BitacoraStatsCards metrics={metricas} />

      <div className="mt-2 px-3 sm:px-0">
        <GestionVehiculosTableShell>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          ) : (
            <BitacorasList bitacoras={bitacoras} />
          )}
        </GestionVehiculosTableShell>
      </div>

      <Crear
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
      <ExportarReporteModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
      />
    </div>
  );
}
