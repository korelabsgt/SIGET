"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { SubmodulosNav } from "../../SubmodulosNav";
import { SolicitudesPanel } from "./SolicitudesPanel";
import { Crear } from "./forms/Crear";
import { SolicitudActionModal } from "./SolicitudActionModal";
import { GestionVehiculosTableShell } from "../lib/table-ui";
import { GvSwitchGroup, GvSwitchItem } from "../lib/switch-ui";

import { useInvalidateSolicitudes, useSolicitudes } from "./lib/hooks";
import { cambiarEstadoSolicitud } from "./lib/actions";
import { type SolicitudRow } from "./lib/zod";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { GV_MODULO_PAGE_CLASS } from "../lib/page-shell";
import { GV_HEADER_ACTIONS_CLASS, GV_HEADER_OUTLINE_BUTTON_CLASS } from "../lib/gv-header-ui";
import { GvMonthPicker } from "../lib/gv-month-picker";
import { registroEnPeriodoCalendario } from "../lib/periodo-filtro";
import { mesCalendarioGt } from "@/lib/fechas-gt";
import { canManageSolicitudesVehiculos } from "../lib/permissions";

const TABS = ["TODAS", "PENDIENTES", "ACTIVAS", "HISTORIAL"] as const;
type TabSolicitud = (typeof TABS)[number];
type AccionSolicitud = "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR";

const TAB_LABELS: Record<TabSolicitud, string> = {
  TODAS: "Todas",
  PENDIENTES: "Pendientes",
  ACTIVAS: "Activas",
  HISTORIAL: "Historial",
};

export function Solicitudes() {
  const { data: solicitudes = [], isLoading: loading } = useSolicitudes();
  const invalidate = useInvalidateSolicitudes();
  const { effectiveRole } = useUserContext();
  const canVerFiltros = canManageSolicitudesVehiculos(effectiveRole);
  const canManage = canVerFiltros;
  const [tabActiva, setTabActiva] = useState<TabSolicitud>("TODAS");
  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);
  const [inDetailView, setInDetailView] = useState(false);
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudRow | null>(null);
  const [actionType, setActionType] = useState<"APROBAR" | "RECHAZAR" | null>(null);
  const [misionPendiente, setMisionPendiente] = useState(false);

  const handleAction = async (solicitud: SolicitudRow, action: AccionSolicitud) => {
    if (action === "INICIAR" || action === "FINALIZAR") {
      if (misionPendiente) return;
      setMisionPendiente(true);
      try {
        const nuevoEstado = action === "INICIAR" ? "EN_MISION" : "FINALIZADA";
        const res = await cambiarEstadoSolicitud(solicitud.id, nuevoEstado);
        if (!res.success) {
          toast.error(res.error || "No se pudo actualizar la misión.");
          return;
        }
        toast.success(action === "INICIAR" ? "Misión iniciada." : "Misión finalizada.");
        invalidate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo actualizar la misión.");
      } finally {
        setMisionPendiente(false);
      }
      return;
    }

    setSelectedSolicitud(solicitud);
    setActionType(action);
    setActionModalOpen(true);
  };

  const filtradas = useMemo(() => {
    return solicitudes.filter((sol) => {
      if (!registroEnPeriodoCalendario(sol.fecha_inicio, periodoFilter)) return false;
      if (!canVerFiltros) return true;
      if (tabActiva === "TODAS") return true;
      if (tabActiva === "PENDIENTES") return sol.estado === "PENDIENTE";
      if (tabActiva === "ACTIVAS") return sol.estado === "APROBADA" || sol.estado === "EN_MISION";
      if (tabActiva === "HISTORIAL") return sol.estado === "FINALIZADA" || sol.estado === "RECHAZADA";
      return true;
    });
  }, [solicitudes, periodoFilter, canVerFiltros, tabActiva]);

  return (
    <div className={GV_MODULO_PAGE_CLASS}>
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />
      {!inDetailView ? <SubmodulosNav /> : null}

      {!inDetailView ? (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                Solicitudes
              </h1>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <GestionVehiculosTableShell
          className={
            inDetailView
              ? "overflow-visible rounded-none border-0 bg-transparent dark:bg-transparent"
              : undefined
          }
          toolbar={
            !inDetailView ? (
              <div className="flex flex-col gap-3 md:col-span-2 lg:flex-row lg:items-center lg:justify-between">
                {canVerFiltros ? (
                  <GvSwitchGroup layoutId="gv-solicitudes-tabs">
                    {TABS.map((tab) => (
                      <GvSwitchItem
                        key={tab}
                        active={tabActiva === tab}
                        onClick={() => setTabActiva(tab)}
                        size="sm"
                      >
                        {TAB_LABELS[tab]}
                      </GvSwitchItem>
                    ))}
                  </GvSwitchGroup>
                ) : null}

                <div className={`${GV_HEADER_ACTIONS_CLASS} lg:ml-auto`}>
                  <GvMonthPicker value={periodoFilter} onChange={setPeriodoFilter} />
                  <button
                    type="button"
                    onClick={() => setFormOpen(true)}
                    className={GV_HEADER_OUTLINE_BUTTON_CLASS}
                  >
                    <Plus className="size-4 shrink-0" />
                    Nueva Solicitud
                  </button>
                </div>
              </div>
            ) : undefined
          }
        >
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          ) : (
            <SolicitudesPanel
              solicitudes={filtradas}
              canManage={canManage}
              onAction={handleAction}
              misionPendiente={misionPendiente}
              onDetailViewChange={setInDetailView}
            />
          )}
        </GestionVehiculosTableShell>
      </div>

      <Crear open={formOpen} onOpenChange={setFormOpen} onSaved={invalidate} />

      <SolicitudActionModal
        open={actionModalOpen}
        onOpenChange={setActionModalOpen}
        solicitud={selectedSolicitud}
        actionType={actionType}
        onSaved={invalidate}
      />
    </div>
  );
}
