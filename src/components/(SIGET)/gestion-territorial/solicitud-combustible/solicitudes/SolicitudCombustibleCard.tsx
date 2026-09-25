"use client";

import { ArrowDownToLine, Ban, Check, FileSpreadsheet } from "lucide";
import { MapPin, Ticket, User } from "lucide-react";

import { GvSigetActionButton, sigetAccent } from "../../gestion-vehiculos/lib/gv-siget-action-button";
import { formatFechaHoraGv } from "../../gestion-vehiculos/lib/gv-fechas";
import {
  GvMobileRecordBadge,
  GvMobileRecordFooter,
  GvMobileRecordHeader,
  GvMobileRecordMeta,
  GvMobileRecordMetaRow,
  GvMobileRecordRow,
} from "../../gestion-vehiculos/lib/gv-mobile-record";

import type { SolicitudCombustibleRow } from "./lib/zod";
import {
  estadoBadgeClassCombustible,
  formatCuponesAsignados,
  formatEstadoSolicitudCombustible,
  formatMisionVinculadaCombustible,
  formatSolicitanteNombre,
  formatVehiculoSolicitudCombustible,
} from "./lib/helpers";

export function SolicitudCombustibleCard({
  row,
  canResolver,
  showSolicitante,
  showAcciones,
  onResolver,
  exporting,
  onExportExcel,
}: {
  row: SolicitudCombustibleRow;
  canResolver: boolean;
  showSolicitante: boolean;
  showAcciones: boolean;
  onResolver: (row: SolicitudCombustibleRow, accion: "APROBAR" | "RECHAZAR") => void;
  exporting: boolean;
  onExportExcel?: (row: SolicitudCombustibleRow) => void;
}) {
  const pendiente = row.estado === "PENDIENTE";
  const aprobado = row.estado === "APROBADO";
  const vehiculo = row.vehiculo;
  const mision = formatMisionVinculadaCombustible(row);

  return (
    <GvMobileRecordRow>
      <GvMobileRecordHeader
        title={
          vehiculo ? (
            <p className="truncate font-semibold text-foreground">
              <span>{vehiculo.placa}</span>
              <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                {vehiculo.marca} {vehiculo.modelo}
              </span>
            </p>
          ) : (
            <p className="truncate font-semibold text-foreground">
              {formatVehiculoSolicitudCombustible(row)}
            </p>
          )
        }
        badge={
          <GvMobileRecordBadge className={estadoBadgeClassCombustible(row.estado)}>
            {formatEstadoSolicitudCombustible(row.estado)}
          </GvMobileRecordBadge>
        }
      />

      <GvMobileRecordMeta>
        {showSolicitante ? (
          <GvMobileRecordMetaRow icon={<User className="size-3.5 text-celeste-trifinio" />}>
            {formatSolicitanteNombre(row)}
          </GvMobileRecordMetaRow>
        ) : null}
        <GvMobileRecordMetaRow icon={<MapPin className="size-3.5 text-celeste-trifinio" />}>
          <span className="line-clamp-2" title={mision}>
            {mision}
          </span>
        </GvMobileRecordMetaRow>
        <GvMobileRecordMetaRow icon={<Ticket className="size-3.5 text-celeste-trifinio" />}>
          <span className="font-semibold tabular-nums">Cupones: {formatCuponesAsignados(row)}</span>
        </GvMobileRecordMetaRow>
      </GvMobileRecordMeta>

      <GvMobileRecordFooter
        left={
          <span className="tabular-nums font-semibold text-foreground">
            {formatFechaHoraGv(row.fecha_solicitud)}
          </span>
        }
        right={
          showAcciones && ((pendiente && canResolver) || (aprobado && onExportExcel)) ? (
            <>
              {pendiente && canResolver ? (
                <>
                  <GvSigetActionButton
                    label="Aprobar"
                    accentColor={sigetAccent.guardar}
                    morphFrom={Check}
                    morphTo={Check}
                    onClick={() => onResolver(row, "APROBAR")}
                    ariaLabel="Aprobar solicitud"
                    className="h-8 w-auto shrink-0 rounded-lg px-3"
                  />
                  <GvSigetActionButton
                    label="Rechazar"
                    accentColor={sigetAccent.quitar}
                    morphFrom={Ban}
                    morphTo={Ban}
                    onClick={() => onResolver(row, "RECHAZAR")}
                    ariaLabel="Rechazar solicitud"
                    className="h-8 w-auto shrink-0 rounded-lg px-3"
                  />
                </>
              ) : null}
              {aprobado && onExportExcel ? (
                <GvSigetActionButton
                  label="Excel"
                  accentColor={sigetAccent.excel}
                  morphFrom={FileSpreadsheet}
                  morphTo={ArrowDownToLine}
                  onClick={() => onExportExcel(row)}
                  disabled={exporting}
                  ariaLabel="Descargar requisición en Excel"
                  className="h-8 w-auto shrink-0 rounded-lg px-3"
                />
              ) : null}
            </>
          ) : undefined
        }
      />
    </GvMobileRecordRow>
  );
}
