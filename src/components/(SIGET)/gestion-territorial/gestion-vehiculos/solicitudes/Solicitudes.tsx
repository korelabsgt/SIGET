"use client";

import { useState } from "react";
import { Plus, Loader2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { SubmodulosNav } from "../../SubmodulosNav";
import { SolicitudesPanel } from "./SolicitudesPanel";
import { Crear } from "./forms/Crear";
import { SolicitudActionModal } from "./SolicitudActionModal";
import { GestionVehiculosTableShell } from "../lib/table-ui";
import { GvSwitchGroup, GvSwitchItem } from "../lib/switch-ui";

import { useInvalidateSolicitudes, useSolicitudes } from "./lib/hooks";
import { type SolicitudRow } from "./lib/zod";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { GV_MODULO_PAGE_CLASS } from "../lib/page-shell";

const TABS = ["TODAS", "PENDIENTES", "ACTIVAS", "HISTORIAL"] as const;
type TabSolicitud = (typeof TABS)[number];

const TAB_LABELS: Record<TabSolicitud, string> = {
  TODAS: "Todas",
  PENDIENTES: "Pendientes",
  ACTIVAS: "Activas",
  HISTORIAL: "Historial",
};

export function Solicitudes() {
  const { data: solicitudes = [], isLoading: loading } = useSolicitudes();
  const invalidate = useInvalidateSolicitudes();
  const { realRole } = useUserContext();
  const canManage = ["super", "admin"].includes(realRole);
  const [tabActiva, setTabActiva] = useState<TabSolicitud>("TODAS");
  const [inDetailView, setInDetailView] = useState(false);
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudRow | null>(null);
  const [actionType, setActionType] = useState<"APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR" | null>(null);

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
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-celeste-trifinio px-5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:opacity-90 sm:w-auto"
          >
            <Plus className="size-4 shrink-0" />
            Nueva Solicitud
          </button>
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
