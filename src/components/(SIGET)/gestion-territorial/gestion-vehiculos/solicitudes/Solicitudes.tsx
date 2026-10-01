"use client";



import { useEffect, useMemo, useState } from "react";

import { Loader2 } from "lucide-react";
import { FilePlus, Plus } from "lucide";
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

import { GvTabFilter } from "../lib/gv-tab-filter";



import { useInvalidateSolicitudes, useSolicitudes } from "./lib/hooks";

import { cambiarEstadoSolicitud } from "./lib/actions";

import { type SolicitudRow } from "./lib/zod";

import { formatEstadoLabel } from "./lib/helpers";

import {
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

  ACTIVAS: "Activas",

  HISTORIAL: "Historial",

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

    return solicitudesDelMes.filter((sol) => {

      if (tabActiva === "TODAS") return true;

      if (tabActiva === "PENDIENTES") return sol.estado === "PENDIENTE";

      if (tabActiva === "ACTIVAS") return sol.estado === "APROBADA" || sol.estado === "EN_MISION";

      if (tabActiva === "HISTORIAL") return sol.estado === "FINALIZADA" || sol.estado === "RECHAZADA";

      return true;

    });

  }, [solicitudesDelMes, tabActiva]);



  const paginacionKey = `${tabActiva}|${periodoFilter}`;

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

              <div className={cn(GV_TABLE_TOOLBAR_PRIMARY_CLASS, "max-lg:order-2 lg:order-1")}>

                <GvTabFilter

                  value={tabActiva}

                  onChange={(val) => setTabActiva(val as TabSolicitud)}

                  layoutId="gv-solicitudes-tabs"

                  compact

                  className="min-w-0 w-full flex-1 lg:w-auto"

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
                  "max-lg:order-1 lg:order-2",
                )}
              >

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
                  className="max-lg:order-1 h-11 max-lg:h-11 max-lg:w-full lg:order-2 lg:h-9 lg:w-auto"
                />

                <GvMonthPicker

                  value={periodoFilter}

                  onChange={setPeriodoFilter}

                  className="max-lg:order-2 !h-11 min-w-0 w-full text-sm lg:hidden"

                />

                <GvMonthPicker

                  value={periodoFilter}

                  onChange={setPeriodoFilter}

                  className="hidden lg:order-1 lg:inline-flex"

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

