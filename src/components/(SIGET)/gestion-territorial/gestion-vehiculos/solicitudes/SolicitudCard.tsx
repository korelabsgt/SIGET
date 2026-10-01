"use client";

import { ArrowRight, Car, CarFront, Eye, MapPin, MapPinned } from "lucide";
import { GvSigetActionButton, sigetAccent } from "../lib/gv-siget-action-button";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import {
  GvMobileRecordBadge,
  GvMobileRecordFooter,
  GvMobileRecordHeader,
  GvMobileRecordMeta,
  GvMobileRecordMetaRow,
  GvMobileRecordRow,
  GV_MOBILE_RECORD_META_ICON_CLASS,
  GV_MOBILE_RECORD_SUBTITLE_CLASS,
  GV_MOBILE_RECORD_TITLE_CLASS,
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
          <p className={GV_MOBILE_RECORD_TITLE_CLASS}>
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
        <GvMobileRecordMetaRow
          icon={
            <GvMorphIcon
              icon={MapPin}
              hoverIcon={MapPinned}
              size={16}
              className={GV_MOBILE_RECORD_META_ICON_CLASS}
            />
          }
        >
          <span className="line-clamp-2" title={solicitud.destino}>
            {solicitud.destino}
          </span>
        </GvMobileRecordMetaRow>
        <GvMobileRecordMetaRow
          icon={
            <GvMorphIcon
              icon={Car}
              hoverIcon={CarFront}
              size={16}
              className={GV_MOBILE_RECORD_META_ICON_CLASS}
            />
          }
        >
          {vehiculo ? (
            <>
              <span className="font-semibold">{vehiculo.placa}</span>
              <span className={GV_MOBILE_RECORD_SUBTITLE_CLASS}>
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
