"use client";

import { ArrowRight, Eye } from "lucide";
import { Car, Fuel, MapPin, Route } from "lucide-react";
import { GvSigetActionButton, sigetAccent } from "../lib/gv-siget-action-button";
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
import { esBitacoraPendiente } from "./lib/bitacora-estado";
import { formatMontoCombustibleBitacora, nombreSolicitanteBitacora } from "./lib/helpers";
import { type BitacoraRow } from "./lib/zod";

export function BitacoraCard({
  bitacora,
  onDetail,
  onConfirmarPendiente,
}: {
  bitacora: BitacoraRow;
  onDetail: (bitacora: BitacoraRow) => void;
  onConfirmarPendiente?: (bitacora: BitacoraRow) => void;
}) {
  const vehiculo = bitacora.ot_vehiculos;
  const combustible = formatMontoCombustibleBitacora(Number(bitacora.monto_combustible));
  const pendiente = esBitacoraPendiente(bitacora);
  const solicitanteNombre = nombreSolicitanteBitacora(bitacora);

  return (
    <GvMobileRecordRow>
      <GvMobileRecordHeader
        title={<p className={GV_MOBILE_RECORD_TITLE_CLASS}>{solicitanteNombre}</p>}
        badge={
          pendiente ? (
            <GvMobileRecordBadge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
              Pendiente
            </GvMobileRecordBadge>
          ) : (
            <GvMobileRecordBadge className="inline-flex items-center gap-1 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400">
              <Route className="size-3" />
              {bitacora.km_recorrido.toLocaleString("es-GT")} km
            </GvMobileRecordBadge>
          )
        }
      />

      <GvMobileRecordMeta>
        <GvMobileRecordMetaRow icon={<MapPin className={GV_MOBILE_RECORD_META_ICON_CLASS} />}>
          <span className="line-clamp-2" title={bitacora.destino}>
            {bitacora.destino}
          </span>
        </GvMobileRecordMetaRow>
        <GvMobileRecordMetaRow icon={<Car className={GV_MOBILE_RECORD_META_ICON_CLASS} />}>
          {vehiculo ? (
            <>
              <span className="font-semibold">{vehiculo.placa}</span>
              <span className={GV_MOBILE_RECORD_SUBTITLE_CLASS}>
                {vehiculo.marca} {vehiculo.modelo}
              </span>
            </>
          ) : (
            <span className="italic text-muted-foreground">Sin vehículo</span>
          )}
        </GvMobileRecordMetaRow>
        {Number(bitacora.monto_combustible) > 0 ? (
          <GvMobileRecordMetaRow icon={<Fuel className={GV_MOBILE_RECORD_META_ICON_CLASS} />}>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {combustible}
            </span>
          </GvMobileRecordMetaRow>
        ) : null}
      </GvMobileRecordMeta>

      <GvMobileRecordFooter
        left={
          <>
            <span className="tabular-nums font-semibold text-foreground">
              {formatFechaHoraGv(bitacora.fecha)}
            </span>
          </>
        }
        right={
          <GvSigetActionButton
            label={pendiente ? "Generar" : "Ver"}
            accentColor={sigetAccent.abrir}
            morphFrom={Eye}
            morphTo={ArrowRight}
            onClick={() =>
              pendiente && onConfirmarPendiente
                ? onConfirmarPendiente(bitacora)
                : onDetail(bitacora)
            }
            ariaLabel={
              pendiente
                ? `Generar bitácora a ${bitacora.destino}`
                : `Ver bitácora a ${bitacora.destino}`
            }
            className="h-8 w-auto shrink-0 rounded-lg px-3"
          />
        }
      />
    </GvMobileRecordRow>
  );
}
