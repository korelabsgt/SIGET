"use client";

import { ArrowRight, Eye } from "lucide";
import { Car, Fuel, MapPin, Route } from "lucide-react";
import { GvSigetActionButton, sigetAccent } from "../lib/gv-siget-action-button";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import {
  GvMobileRecordFooter,
  GvMobileRecordHeader,
  GvMobileRecordMeta,
  GvMobileRecordMetaRow,
  GvMobileRecordRow,
} from "../lib/gv-mobile-record";
import { formatMontoCombustibleBitacora } from "./lib/helpers";
import { type BitacoraRow } from "./lib/zod";

export function BitacoraCard({
  bitacora,
  onDetail,
}: {
  bitacora: BitacoraRow;
  onDetail: (bitacora: BitacoraRow) => void;
}) {
  const vehiculo = bitacora.ter_vehiculos;
  const combustible = formatMontoCombustibleBitacora(Number(bitacora.monto_combustible));

  return (
    <GvMobileRecordRow>
      <GvMobileRecordHeader
        title={
          <p className="truncate font-semibold text-foreground">
            {bitacora.profiles?.nombre || "Desconocido"}
          </p>
        }
        badge={
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-700 dark:bg-sky-950 dark:text-sky-400">
            <Route className="size-3" />
            {bitacora.km_recorrido.toLocaleString("es-GT")} km
          </span>
        }
      />

      <GvMobileRecordMeta>
        <GvMobileRecordMetaRow icon={<MapPin className="size-3.5 text-celeste-trifinio" />}>
          <span className="line-clamp-2" title={bitacora.destino}>
            {bitacora.destino}
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
            <span className="italic text-muted-foreground">Sin vehículo</span>
          )}
        </GvMobileRecordMetaRow>
        {Number(bitacora.monto_combustible) > 0 ? (
          <GvMobileRecordMetaRow icon={<Fuel className="size-3.5 text-celeste-trifinio" />}>
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
            label="Ver"
            accentColor={sigetAccent.abrir}
            morphFrom={Eye}
            morphTo={ArrowRight}
            onClick={() => onDetail(bitacora)}
            ariaLabel={`Ver bitácora a ${bitacora.destino}`}
            className="h-8 w-auto shrink-0 rounded-lg px-3"
          />
        }
      />
    </GvMobileRecordRow>
  );
}
