"use client";

import { ArrowRight, Eye } from "lucide";
import { Car, MapPin } from "lucide-react";
import { GvSigetActionButton, sigetAccent } from "../lib/gv-siget-action-button";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import {
  GvMobileRecordBadge,
  GvMobileRecordFooter,
  GvMobileRecordHeader,
  GvMobileRecordMeta,
  GvMobileRecordMetaRow,
  GvMobileRecordRow,
} from "../lib/gv-mobile-record";
import { estadoBadgeClass, formatEstadoLabel } from "./lib/helpers";
import { type SolicitudRow } from "./lib/zod";

export function SolicitudCard({
  solicitud,
  onDetail,
}: {
  solicitud: SolicitudRow;
  onDetail: (solicitud: SolicitudRow) => void;
}) {
  const vehiculo = solicitud.vehiculo;

  return (
    <GvMobileRecordRow>
      <GvMobileRecordHeader
        title={
          <p className="truncate font-semibold text-foreground">
            {solicitud.solicitante?.nombre || "Desconocido"}
          </p>
        }
        badge={
          <GvMobileRecordBadge className={estadoBadgeClass(solicitud.estado)}>
            {formatEstadoLabel(solicitud.estado)}
          </GvMobileRecordBadge>
        }
      />

      <GvMobileRecordMeta>
        <GvMobileRecordMetaRow icon={<MapPin className="size-3.5 text-celeste-trifinio" />}>
          <span className="line-clamp-2" title={solicitud.destino}>
            {solicitud.destino}
          </span>
        </GvMobileRecordMetaRow>
        <GvMobileRecordMetaRow icon={<Car className="size-3.5 text-celeste-trifinio" />}>
          {vehiculo ? (
            <>
              <span className="font-semibold">{vehiculo.placa}</span>
              <span className="text-xs text-muted-foreground">
                {vehiculo.marca} {vehiculo.modelo}
              </span>
            </>
          ) : (
            <span className="italic text-muted-foreground">Sin asignar</span>
          )}
        </GvMobileRecordMetaRow>
      </GvMobileRecordMeta>

      <GvMobileRecordFooter
        left={
          <>
            <span className="tabular-nums font-semibold text-foreground">
              {formatFechaHoraGv(solicitud.fecha_inicio)}
            </span>
          </>
        }
        right={
          <GvSigetActionButton
            label="Ver"
            accentColor={sigetAccent.abrir}
            morphFrom={Eye}
            morphTo={ArrowRight}
            onClick={() => onDetail(solicitud)}
            ariaLabel={`Ver solicitud a ${solicitud.destino}`}
            className="h-8 w-auto shrink-0 rounded-lg px-3"
          />
        }
      />
    </GvMobileRecordRow>
  );
}
