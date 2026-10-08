"use client";



import { useEffect, useMemo, useState } from "react";

import { Loader2 } from "lucide-react";
import { FilePlus, Plus, ScanSearch, Search } from "lucide";
import { GvMorphIcon } from "../lib/morph-icon";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";

import { toast } from "react-toastify";



import { SolicitudesPanel } from "./SolicitudesPanel";

import { Crear } from "./forms/Crear";

import { SolicitudActionModal } from "./SolicitudActionModal";

import {
  GestionVehiculosTableShell,
  GV_TABLE_BODY_CENTER_CLASS,
  GV_TABLE_RECORD_SCROLL,
} from "../lib/table-ui";

import { useGvTablePagination } from "../lib/table-pagination";

import { GvToolbarSelect } from "../lib/gv-toolbar-select";



import { useInvalidateSolicitudes, useSolicitudes } from "./lib/hooks";

import { cambiarEstadoSolicitud } from "./lib/actions";

import { type SolicitudRow } from "./lib/zod";

import { compararSolicitudesTabla, formatEstadoLabel } from "./lib/helpers";

import {
  GV_TABLE_SEARCH_INPUT_CLASS,
  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
  GV_TABLE_TOOLBAR_ACTIONS_PAIR_CLASS,
  GV_TABLE_TOOLBAR_PRIMARY_CLASS,
  GV_TABLE_TOOLBAR_ROW_CLASS,
} from "../lib/gv-header-ui";


import { GvTableSectionMotion } from "../lib/gv-table-motion";

import { GvMonthPicker } from "../lib/gv-month-picker";

import { registroEnPeriodoCalendario } from "../lib/periodo-filtro";

import { mesCalendarioGt } from "@/lib/fechas-gt";

import { canAprobarRechazarSolicitudes } from "../lib/permissions";

import { useGvPermissionRole } from "../lib/gv-permissions-hook";

import { useGvPanelChrome } from "../lib/gv-page-chrome";

import { useGvSolicitudDetailIntent } from "../lib/gv-solicitud-detail-intent";
import { useBitacoraPendienteBloqueos } from "../lib/bitacora-pendiente-hooks";
import { mensajeBloqueoNuevaSolicitudVehiculo } from "../lib/bitacora-pendiente-bloqueo";
import { cn } from "@/lib/utils";



const TABS = ["TODAS", "PENDIENTES", "ACTIVAS", "HISTORIAL"] as const;

type TabSolicitud = (typeof TABS)[number];

type AccionSolicitud = "APROBAR" | "RECHAZAR" | "INICIAR" | "CANCELAR";



const TAB_LABELS: Record<TabSolicitud, string> = {

  TODAS: "Todas",

  PENDIENTES: "Pendientes",

  ACTIVAS: "Aprobadas",

  HISTORIAL: "Finalizadas",

};



export function Solicitudes() {

  const { data: solicitudes = [], isLoading: loading } = useSolicitudes();

  const invalidate = useInvalidateSolicitudes();

  const gvRole = useGvPermissionRole();

  const { data: bloqueosBitacora } = useBitacoraPendienteBloqueos();
  const solicitudDetailIntent = useGvSolicitudDetailIntent();
  const bloqueoNuevaSolicitudVehiculo = bloqueosBitacora?.vehiculo ?? null;

  const canAprobarRechazar = canAprobarRechazarSolicitudes(gvRole);

  const [tabActiva, setTabActiva] = useState<TabSolicitud>("TODAS");

  const [searchQuery, setSearchQuery] = useState("");

  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);



  const [formOpen, setFormOpen] = useState(false);

  const [actionModalOpen, setActionModalOpen] = useState(false);

  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudRow | null>(null);

  const [actionType, setActionType] = useState<"APROBAR" | "RECHAZAR" | "CANCELAR" | null>(
    null,
  );

  const [misionPendiente, setMisionPendiente] = useState(false);

  const [detailSolicitud, setDetailSolicitud] = useState<SolicitudRow | null>(null);



  const handleAction = async (solicitud: SolicitudRow, action: AccionSolicitud) => {

    if (action === "INICIAR") {

      if (misionPendiente) return;

      setMisionPendiente(true);

      try {

        const res = await cambiarEstadoSolicitud(solicitud.id, "EN_MISION");

        if (!res.success) {

          toast.error(res.error || "No se pudo actualizar la misión.");

          return;

        }

        toast.success("Misión iniciada.");

        invalidate();

      } catch (error) {

        toast.error(error instanceof Error ? error.message : "No se pudo actualizar la misión.");

      } finally {

        setMisionPendiente(false);

      }

      return;

    }



    if (action === "APROBAR" || action === "RECHAZAR" || action === "CANCELAR") {

      const fresh = solicitudes.find((item) => item.id === solicitud.id) ?? solicitud;

      if (action === "CANCELAR") {
        if (fresh.estado !== "APROBADA") {
          toast.warn(
            `Esta solicitud ya no está aprobada (${formatEstadoLabel(fresh.estado).toLowerCase()}).`,
          );
          invalidate();
          return;
        }
      } else if (fresh.estado !== "PENDIENTE") {

        toast.warn(

          `Esta solicitud ya está ${formatEstadoLabel(fresh.estado).toLowerCase()}.`,

        );

        invalidate();

        return;

      }

      setSelectedSolicitud(fresh);

      setActionType(action);

      setActionModalOpen(true);

      return;

    }

  };



  const solicitudesDelMes = useMemo(

    () =>

      solicitudes.filter((sol) =>

        registroEnPeriodoCalendario(sol.fecha_inicio, periodoFilter),

      ),

    [solicitudes, periodoFilter],

  );



  const filtradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtradas = solicitudesDelMes.filter((sol) => {
      if (tabActiva === "PENDIENTES" && sol.estado !== "PENDIENTE") return false;
      if (
        tabActiva === "ACTIVAS" &&
        sol.estado !== "APROBADA" &&
        sol.estado !== "EN_MISION"
      ) {
        return false;
      }
      if (
        tabActiva === "HISTORIAL" &&
        sol.estado !== "FINALIZADA" &&
        sol.estado !== "RECHAZADA"
      ) {
        return false;
      }

      if (!q) return true;

      const estado = formatEstadoLabel(sol.estado).toLowerCase();
      return (
        (sol.solicitante?.nombre?.toLowerCase().includes(q) ?? false) ||
        (sol.solicitante?.email?.toLowerCase().includes(q) ?? false) ||
        sol.destino.toLowerCase().includes(q) ||
        (sol.vehiculo?.placa.toLowerCase().includes(q) ?? false) ||
        (sol.vehiculo?.marca.toLowerCase().includes(q) ?? false) ||
        (sol.vehiculo?.modelo.toLowerCase().includes(q) ?? false) ||
        estado.includes(q)
      );
    });

    return [...filtradas].sort(compararSolicitudesTabla);
  }, [solicitudesDelMes, tabActiva, searchQuery]);



  const paginacionKey = `${tabActiva}|${periodoFilter}|${searchQuery}`;

  const {

    pageItems: solicitudesPaginadas,

    pageSafe,

    totalPages,

    pageSize,

    setPage,

    setPageSize,

  } = useGvTablePagination(filtradas, paginacionKey);



  useGvPanelChrome("solicitudes");

  useEffect(() => {
    const pendingId = solicitudDetailIntent?.pendingSolicitudId;
    if (!pendingId || loading) return;
    const sol = solicitudes.find((item) => item.id === pendingId);
    if (!sol) return;
    setDetailSolicitud(sol);
    solicitudDetailIntent?.clearPendingSolicitudDetail();
  }, [
    loading,
    solicitudes,
    solicitudDetailIntent?.pendingSolicitudId,
    solicitudDetailIntent?.clearPendingSolicitudDetail,
  ]);

  return (

    <>

      <GvTableSectionMotion panelId="solicitudes">

        <GestionVehiculosTableShell
          visibleRows={GV_TABLE_RECORD_SCROLL}

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

          toolbar={

            <div className={GV_TABLE_TOOLBAR_ROW_CLASS}>

              <div className={cn(GV_TABLE_TOOLBAR_PRIMARY_CLASS, "max-lg:flex-col max-lg:items-stretch")}>
                <div className="relative min-w-0 w-full lg:flex-1" data-morph-hover-scope>
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-celeste-trifinio">
                    <GvMorphIcon icon={Search} hoverIcon={ScanSearch} size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar solicitante, destino o placa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(GV_TABLE_SEARCH_INPUT_CLASS, "pl-10")}
                  />
                </div>

                <GvToolbarSelect
                  value={tabActiva}
                  onChange={setTabActiva}
                  ariaLabel="Filtrar solicitudes por estado"
                  options={TABS.map((tab) => ({
                    value: tab,
                    label: TAB_LABELS[tab],
                  }))}
                />
              </div>

              <div
                className={cn(
                  GV_TABLE_TOOLBAR_ACTIONS_CLASS,
                  GV_TABLE_TOOLBAR_ACTIONS_PAIR_CLASS,
                  "min-w-0 w-full max-lg:col-span-full",
                )}
              >
                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="!h-11 min-w-0 w-full text-sm lg:hidden"
                />

                <GvMonthPicker
                  value={periodoFilter}
                  onChange={setPeriodoFilter}
                  className="hidden shrink-0 lg:inline-flex"
                />

                <SigetActionButton
                  type="button"
                  label={
                    <>
                      <span className="max-lg:inline lg:hidden">Solicitar</span>
                      <span className="hidden lg:inline">Crear</span>
                    </>
                  }
                  ariaLabel="Nueva solicitud"
                  accentColor={sigetAccent.crear}
                  morphFrom={Plus}
                  morphTo={FilePlus}
                  disabled={Boolean(bloqueoNuevaSolicitudVehiculo)}
                  onClick={() => {
                    if (bloqueoNuevaSolicitudVehiculo) {
                      toast.warn(
                        mensajeBloqueoNuevaSolicitudVehiculo(bloqueoNuevaSolicitudVehiculo),
                      );
                      return;
                    }
                    setFormOpen(true);
                  }}
                  className="h-11 w-auto max-lg:h-11 max-lg:w-full shrink-0 lg:w-[10.5rem]"
                />
              </div>

            </div>

          }

        >

          {loading ? (

            <div className={GV_TABLE_BODY_CENTER_CLASS}>

              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />

            </div>

          ) : (

            <SolicitudesPanel

              solicitudes={solicitudesPaginadas}

              catalogo={filtradas}

              onAction={handleAction}

              misionPendiente={misionPendiente}

              detail={detailSolicitud}

              onDetailChange={setDetailSolicitud}

            />

          )}

        </GestionVehiculosTableShell>

      </GvTableSectionMotion>



      <Crear open={formOpen} onOpenChange={setFormOpen} onSaved={invalidate} />



      <SolicitudActionModal

        open={actionModalOpen}

        onOpenChange={setActionModalOpen}

        solicitud={

          selectedSolicitud

            ? solicitudes.find((item) => item.id === selectedSolicitud.id) ?? selectedSolicitud

            : null

        }

        actionType={actionType}

        onSaved={invalidate}

      />

    </>

  );

}

