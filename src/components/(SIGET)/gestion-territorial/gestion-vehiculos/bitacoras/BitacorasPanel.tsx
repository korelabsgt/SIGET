"use client";

import { useRouter } from "next/navigation";

import { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SubmodulosNav } from "../../SubmodulosNav";
import { BitacorasList } from "./BitacorasList";
import { BitacoraStatsCards } from "./BitacoraStatsCards";
import { BitacoraFormModal } from "./BitacoraFormModal";
import { ExportarReporteModal } from "./ExportarReporteModal";
import { getBitacoras, getMetricasBitacoras, createBitacora } from "./lib/actions";
import { type BitacoraRow, type BitacoraInput } from "./lib/zod";
import { toast } from "react-toastify";

export function BitacorasPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bitacoras, setBitacoras] = useState<BitacoraRow[]>([]);
  const [metricas, setMetricas] = useState({ total_km: 0, total_combustible: 0, total_misiones: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [bits, mets] = await Promise.all([
        getBitacoras(),
        getMetricasBitacoras()
      ]);
      setBitacoras(bits);
      setMetricas(mets);
    } catch (error) {
      toast.error("Error al cargar las bitácoras");
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (data: BitacoraInput) => {
    const res = await createBitacora(data);
    if (res.success) {
      await loadData();
      return true;
    }
    return false;
  };

  return (
    <div className="mx-auto w-full px-0 pt-6 pb-20 sm:px-6 md:pt-10 lg:px-8 xl:w-[90%] relative">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />
      
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 px-3 sm:px-0">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push("/siget")}
            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
              Gestión Territorial
            </p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight uppercase">
              Bitácora de Viajes
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setExportModalOpen(true)}
            className="text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200 font-semibold rounded-xl shadow-sm transition-all"
          >
            Exportar Reporte
          </Button>
          <Button 
            onClick={() => setModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus className="mr-2 h-4 w-4" /> Registrar Viaje
          </Button>
        </div>
      </div>

      <SubmodulosNav />

      <BitacoraStatsCards metrics={metricas} />

      <div className="px-3 sm:px-0 mt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 min-h-[400px] bg-card rounded-2xl border border-border">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="mt-4 text-sm text-muted-foreground font-medium">Cargando bitácoras...</p>
          </div>
        ) : (
          <BitacorasList bitacoras={bitacoras} />
        )}
      </div>

      <BitacoraFormModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onSubmit={handleCreate}
      />
      <ExportarReporteModal 
        open={exportModalOpen} 
        onOpenChange={setExportModalOpen} 
      />
    </div>
  );
}
