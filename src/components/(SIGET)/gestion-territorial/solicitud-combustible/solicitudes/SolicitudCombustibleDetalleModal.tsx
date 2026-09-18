"use client";

import { ArrowDownToLine, Ban, Check, FileSpreadsheet } from "lucide";

import { GvModalShell, GvModalInset } from "../../gestion-vehiculos/lib/gv-modal-shell";
import { GvSigetActionButton, sigetAccent } from "../../gestion-vehiculos/lib/gv-siget-action-button";
import { GV_DETALLE_CARD_CLASS, GV_DETALLE_TEXTO_CLASS } from "../../gestion-vehiculos/lib/detalle-ui";
import { cn } from "@/lib/utils";

import type { SolicitudCombustibleRow } from "./lib/zod";
import {
  estadoBadgeClassCombustible,
  formatCuponesAsignados,
  formatDenominacionCuponSolicitud,
  formatEstadoSolicitudCombustible,
  formatFechaSolicitudCombustible,
  formatMisionVinculadaCombustible,
  formatMontoEntregaCombustible,
  formatSolicitanteNombre,
  cantidadCuponesSolicitud,
} from "./lib/helpers";

function DetalleFila({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-border/60 py-3 first:border-t-0 first:pt-0 dark:border-zinc-700/60 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold text-foreground sm:max-w-[65%] sm:text-right", GV_DETALLE_TEXTO_CLASS)}>
        {value}
      </p>
    </div>
  );
}

export function SolicitudCombustibleDetalleModal({
  open,
  onClose,
  solicitud,
  canResolver,
  canExport,
  exporting,
  onResolver,
  onExportExcel,
}: {
  open: boolean;
  onClose: () => void;
  solicitud: SolicitudCombustibleRow | null;
  canResolver: boolean;
  canExport: boolean;
  exporting: boolean;
  onResolver: (row: SolicitudCombustibleRow, accion: "APROBAR" | "RECHAZAR") => void;
  onExportExcel?: (row: SolicitudCombustibleRow) => void;
}) {
  if (!solicitud) return null;

  const pendiente = solicitud.estado === "PENDIENTE";
  const aprobado = solicitud.estado === "APROBADO";
  const vehiculo = solicitud.vehiculo;
  const vehiculoTitulo = vehiculo
    ? `${vehiculo.marca} ${vehiculo.modelo}`.trim()
    : "Vehículo";
  const vehiculoPlaca = vehiculo?.placa?.trim() || "—";

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title="Solicitud de combustible"
      subtitle={formatEstadoSolicitudCombustible(solicitud.estado)}
      maxWidth="max-w-lg"
    >
      <GvModalInset>
        <div className={GV_DETALLE_CARD_CLASS}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoBadgeClassCombustible(solicitud.estado)}`}
            >
              {formatEstadoSolicitudCombustible(solicitud.estado)}
            </span>
          </div>
          <DetalleFila label="Fecha solicitud" value={formatFechaSolicitudCombustible(solicitud.fecha_solicitud)} />
          <DetalleFila label="Vehículo" value={vehiculoTitulo} />
          <DetalleFila label="Placa" value={vehiculoPlaca} />
          <DetalleFila label="Misión vinculada" value={formatMisionVinculadaCombustible(solicitud)} />
          <DetalleFila label="Solicitante" value={formatSolicitanteNombre(solicitud)} />
          <DetalleFila label="Cupones (del – al)" value={formatCuponesAsignados(solicitud)} />
          <DetalleFila
            label="Cantidad de cupones"
            value={
              cantidadCuponesSolicitud(solicitud) > 0
                ? String(cantidadCuponesSolicitud(solicitud))
                : "—"
            }
          />
          <DetalleFila label="Denominación" value={formatDenominacionCuponSolicitud(solicitud)} />
          <DetalleFila label="Monto entregado" value={formatMontoEntregaCombustible(solicitud)} />
          {solicitud.comentarios?.trim() ? (
            <DetalleFila label="Comentarios" value={solicitud.comentarios.trim()} />
          ) : null}
        </div>

        {(pendiente && canResolver) || (aprobado && canExport && onExportExcel) ? (
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {pendiente && canResolver ? (
              <>
                <GvSigetActionButton
                  label="Rechazar"
                  accentColor={sigetAccent.quitar}
                  morphFrom={Ban}
                  morphTo={Ban}
                  onClick={() => {
                    onResolver(solicitud, "RECHAZAR");
                    onClose();
                  }}
                  ariaLabel="Rechazar solicitud"
                  className="w-auto shrink-0"
                />
                <GvSigetActionButton
                  label="Aprobar"
                  accentColor={sigetAccent.guardar}
                  morphFrom={Check}
                  morphTo={Check}
                  onClick={() => {
                    onResolver(solicitud, "APROBAR");
                    onClose();
                  }}
                  ariaLabel="Aprobar solicitud"
                  className="w-auto shrink-0"
                />
              </>
            ) : null}
            {aprobado && canExport && onExportExcel ? (
              <GvSigetActionButton
                label="Excel"
                accentColor={sigetAccent.excel}
                morphFrom={FileSpreadsheet}
                morphTo={ArrowDownToLine}
                onClick={() => onExportExcel(solicitud)}
                disabled={exporting}
                ariaLabel="Descargar requisición en Excel"
                className="w-auto shrink-0"
              />
            ) : null}
          </div>
        ) : null}
      </GvModalInset>
    </GvModalShell>
  );
}
