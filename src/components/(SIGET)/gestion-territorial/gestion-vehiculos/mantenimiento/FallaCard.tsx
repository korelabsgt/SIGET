"use client";

import { ArrowRight, Eye } from "lucide";
import { AlertTriangle, Car, Wrench } from "lucide-react";
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
import { type FallaRow } from "./lib/zod";
import {
  estadoFallaBadgeClass,
  formatEstadoFallaLabel,
  formatSeveridadLabel,
  severidadBadgeClass,
} from "./lib/helpers";

export function FallaCard({
  falla,
  onDetail,
}: {
  falla: FallaRow;
  onDetail: (falla: FallaRow) => void;
}) {
  const vehiculo = falla.vehiculo;

  return (
    <GvMobileRecordRow>
      <GvMobileRecordHeader
        title={
          <p className="truncate font-semibold text-foreground">{falla.reportador.nombre}</p>
        }
        badge={
          <GvMobileRecordBadge className={estadoFallaBadgeClass(falla.estado)}>
            {formatEstadoFallaLabel(falla.estado)}
          </GvMobileRecordBadge>
        }
      />

      <GvMobileRecordMeta>
        <GvMobileRecordMetaRow icon={<Wrench className="size-3.5 text-celeste-trifinio" />}>
          <span className="line-clamp-2" title={falla.descripcion}>
            {falla.descripcion}
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
        <GvMobileRecordMetaRow icon={<AlertTriangle className="size-3.5 text-celeste-trifinio" />}>
          <GvMobileRecordBadge className={severidadBadgeClass(falla.severidad)}>
            {formatSeveridadLabel(falla.severidad)}
          </GvMobileRecordBadge>
        </GvMobileRecordMetaRow>
      </GvMobileRecordMeta>

      <GvMobileRecordFooter
        left={
          <>
            <span className="tabular-nums font-semibold text-foreground">
              {formatFechaHoraGv(falla.created_at)}
            </span>
          </>
        }
        right={
          <GvSigetActionButton
            label="Ver"
            accentColor={sigetAccent.abrir}
            morphFrom={Eye}
            morphTo={ArrowRight}
            onClick={() => onDetail(falla)}
            ariaLabel={`Ver avería de ${vehiculo?.placa ?? "vehículo"}`}
            className="h-8 w-auto shrink-0 rounded-lg px-3"
          />
        }
      />
    </GvMobileRecordRow>
  );
}
