"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { SubmodulosNav } from "../../SubmodulosNav";
import { SolicitudesList } from "./SolicitudesList";
import { SolicitudFormModal } from "./SolicitudFormModal";
import { SolicitudActionModal } from "./SolicitudActionModal";

import { getSolicitudes } from "./lib/actions";
import { type SolicitudRow } from "./lib/zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SolicitudesPanel() {
  const [solicitudes, setSolicitudes] = useState<SolicitudRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState<"TODAS" | "PENDIENTES" | "ACTIVAS" | "HISTORIAL">("TODAS");
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(false);
  
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudRow | null>(null);
  const [actionType, setActionType] = useState<"APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR" | null>(null);

  const fetchSolicitudes = async () => {
    setLoading(true);
    const data = await getSolicitudes();
    setSolicitudes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const handleAction = (solicitud: SolicitudRow, action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR") => {
    setSelectedSolicitud(solicitud);
    setActionType(action);
    setActionModalOpen(true);
  };

  const filtradas = solicitudes.filter((sol) => {
    if (tabActiva === "TODAS") return true;
    if (tabActiva === "PENDIENTES") return sol.estado === "PENDIENTE";
    if (tabActiva === "ACTIVAS") return sol.estado === "APROBADA" || sol.estado === "EN_MISION";
    if (tabActiva === "HISTORIAL") return sol.estado === "FINALIZADA" || sol.estado === "RECHAZADA";
    return true;
  });

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
              Solicitudes
            </h1>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)} className="w-full md:w-auto font-bold rounded-xl shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Solicitud
        </Button>
      </div>

      <SubmodulosNav />

      <div className="px-3 sm:px-0">
        <div className="mb-6 flex flex-wrap gap-2 border-b border-border/50 pb-4">
          {["TODAS", "PENDIENTES", "ACTIVAS", "HISTORIAL"].map((tab) => (
            <button
              key={tab}
              onClick={() => setTabActiva(tab as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                tabActiva === tab
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              )}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-sm text-muted-foreground font-medium">Cargando solicitudes...</p>
          </div>
        ) : (
          <SolicitudesList solicitudes={filtradas} onAction={handleAction} />
        )}
      </div>

      <SolicitudFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={fetchSolicitudes}
      />

      <SolicitudActionModal
        open={actionModalOpen}
        onOpenChange={setActionModalOpen}
        solicitud={selectedSolicitud}
        actionType={actionType}
        onSaved={fetchSolicitudes}
      />
    </div>
  );
}
