"use client";



import { useMemo, useState } from "react";

import { Plus, Loader2 } from "lucide-react";

import { toast } from "react-toastify";



import { SolicitudesPanel } from "./SolicitudesPanel";

import { Crear } from "./forms/Crear";

import { SolicitudActionModal } from "./SolicitudActionModal";

import { GestionVehiculosTableShell, GV_TABLE_BODY_CENTER_CLASS, gvTableShellVisibleRows } from "../lib/table-ui";

import { useGvTablePagination } from "../lib/table-pagination";

import { GvTabFilter } from "../lib/gv-tab-filter";



import { useInvalidateSolicitudes, useSolicitudes } from "./lib/hooks";

import { cambiarEstadoSolicitud } from "./lib/actions";

import { type SolicitudRow } from "./lib/zod";

import { formatEstadoLabel } from "./lib/helpers";

import { GV_HEADER_OUTLINE_BUTTON_CLASS, GV_TABLE_TOOLBAR_ACTIONS_CLASS, GV_TABLE_TOOLBAR_PRIMARY_CLASS, GV_TABLE_TOOLBAR_ROW_CLASS } from "../lib/gv-header-ui";


import { GvTableSectionMotion } from "../lib/gv-table-motion";

import { GvMonthPicker } from "../lib/gv-month-picker";

import { registroEnPeriodoCalendario } from "../lib/periodo-filtro";

import { mesCalendarioGt } from "@/lib/fechas-gt";

import {
  canAprobarRechazarSolicitudes,
  canViewGvCampanaNotificaciones,
} from "../lib/permissions";

import { useGvPermissionRole } from "../lib/gv-permissions-hook";

import { useGvPanelChrome, GvHeaderExtras } from "../lib/gv-page-chrome";

import { SolicitudesNotificaciones } from "./SolicitudesNotificaciones";

import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useBitacoraPendienteBloqueos } from "../lib/bitacora-pendiente-hooks";
import { mensajeBloqueoNuevaSolicitudVehiculo } from "../lib/bitacora-pendiente-bloqueo";
import { cn } from "@/lib/utils";



const TABS = ["TODAS", "PENDIENTES", "ACTIVAS", "HISTORIAL"] as const;

type TabSolicitud = (typeof TABS)[number];

type AccionSolicitud = "APROBAR" | "RECHAZAR" | "INICIAR";



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

  const { user } = useUserContext();

  const { data: bloqueosBitacora } = useBitacoraPendienteBloqueos();
  const bloqueoNuevaSolicitudVehiculo = bloqueosBitacora?.vehiculo ?? null;

  const canAprobarRechazar = canAprobarRechazarSolicitudes(gvRole);

  const puedeVerCampanaGestion = canViewGvCampanaNotificaciones(gvRole);

  const [tabActiva, setTabActiva] = useState<TabSolicitud>("TODAS");

  const [periodoFilter, setPeriodoFilter] = useState(mesCalendarioGt);



  const [formOpen, setFormOpen] = useState(false);

  const [actionModalOpen, setActionModalOpen] = useState(false);

  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudRow | null>(null);

  const [actionType, setActionType] = useState<"APROBAR" | "RECHAZAR" | null>(null);

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



    if (action === "APROBAR" || action === "RECHAZAR") {

      const fresh = solicitudes.find((item) => item.id === solicitud.id) ?? solicitud;

      if (fresh.estado !== "PENDIENTE") {

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



  const tableVisibleRows = gvTableShellVisibleRows(pageSize);



  useGvPanelChrome("solicitudes");



  return (

    <>

      <GvHeaderExtras panelId="solicitudes">
        {!loading ? (
          <SolicitudesNotificaciones
            solicitudes={solicitudes}
            variant={puedeVerCampanaGestion ? "gestion" : "usuario"}
            userId={user?.id}
            onAbrirSolicitud={(id) => {
              const sol = solicitudes.find((item) => item.id === id);
              if (sol) setDetailSolicitud(sol);
            }}
          />
        ) : null}
      </GvHeaderExtras>

      <GvTableSectionMotion panelId="solicitudes">

        <GestionVehiculosTableShell

          visibleRows={tableVisibleRows}

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

              <div className={GV_TABLE_TOOLBAR_PRIMARY_CLASS}>

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

                <GvMonthPicker

                  value={periodoFilter}

                  onChange={setPeriodoFilter}

                  className="!h-11 min-w-0 w-full text-xs lg:hidden sm:w-[10.5rem]"

                />

              </div>



              <div className={GV_TABLE_TOOLBAR_ACTIONS_CLASS}>

                <GvMonthPicker

                  value={periodoFilter}

                  onChange={setPeriodoFilter}

                  className="hidden lg:inline-flex"

                />

                <button

                  type="button"

                  onClick={() => {
                    if (bloqueoNuevaSolicitudVehiculo) {
                      toast.warn(
                        mensajeBloqueoNuevaSolicitudVehiculo(bloqueoNuevaSolicitudVehiculo),
                      );
                      return;
                    }
                    setFormOpen(true);
                  }}

                  className={cn(
                    GV_HEADER_OUTLINE_BUTTON_CLASS,
                    bloqueoNuevaSolicitudVehiculo && "cursor-not-allowed opacity-50",
                  )}

                  aria-disabled={bloqueoNuevaSolicitudVehiculo ? true : undefined}

                >

                  <Plus className="size-4 shrink-0" />

                  <span className="lg:hidden">Nueva</span>

                  <span className="hidden lg:inline">Nueva solicitud</span>

                </button>

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

