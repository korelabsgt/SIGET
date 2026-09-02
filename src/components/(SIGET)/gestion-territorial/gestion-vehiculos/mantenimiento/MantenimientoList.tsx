"use client";

import { ArrowRight, Eye } from "lucide";
import { Wrench } from "lucide-react";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { type FallaRow } from "./lib/zod";
import {
  GestionVehiculosTable,
  GestionVehiculosTableEmpty,
  GestionVehiculosThead,
  GestionVehiculosActionCell,
  gvTableActionTdClass,
  gvTableActionThClass,
  gvTableHeaderThClass,
} from "../lib/table-ui";
import {
  estadoFallaBadgeClass,
  FALLA_BADGE_BASE_CLASS,
  formatEstadoFallaLabel,
  formatSeveridadLabel,
  formatVehiculoFalla,
  severidadBadgeClass,
} from "./lib/helpers";

function FallaListRow({
  falla,
  onDetail,
}: {
  falla: FallaRow;
  onDetail: (falla: FallaRow) => void;
}) {
  return (
    <tr className="border-b border-border last:border-0 transition-colors hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20">
      <td className="px-4 py-3 align-middle text-center">
        <p className="truncate font-semibold text-foreground">{formatVehiculoFalla(falla)}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle text-center">
        <span className={`${FALLA_BADGE_BASE_CLASS} ${severidadBadgeClass(falla.severidad)}`}>
          {formatSeveridadLabel(falla.severidad)}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle text-center">
        <span className={`${FALLA_BADGE_BASE_CLASS} ${estadoFallaBadgeClass(falla.estado)}`}>
          {formatEstadoFallaLabel(falla.estado)}
        </span>
      </td>
      <td className="max-w-[28rem] px-4 py-3 align-middle text-center">
        <p className="line-clamp-2 text-sm text-foreground" title={falla.descripcion}>
          {falla.descripcion}
        </p>
      </td>
      <td className={gvTableActionTdClass}>
        <GestionVehiculosActionCell>
          <SigetActionButton
            label="Ver"
            accentColor={sigetAccent.abrir}
            morphFrom={Eye}
            morphTo={ArrowRight}
            onClick={() => onDetail(falla)}
            ariaLabel={`Ver avería de ${formatVehiculoFalla(falla)}`}
            className="w-auto shrink-0"
          />
        </GestionVehiculosActionCell>
      </td>
    </tr>
  );
}

export function MantenimientoList({
  fallas,
  onDetail,
}: {
  fallas: FallaRow[];
  onDetail: (falla: FallaRow) => void;
}) {
  if (fallas.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<Wrench className="size-10" />}
        title="No hay registros"
        description="No se encontraron averías en esta categoría."
      />
    );
  }

  return (
    <GestionVehiculosTable minWidth={720}>
      <GestionVehiculosThead
        cells={[
          { key: "vehiculo", label: "Vehículo", className: gvTableHeaderThClass },
          { key: "severidad", label: "Severidad", className: gvTableHeaderThClass },
          { key: "estado", label: "Estado", className: gvTableHeaderThClass },
          { key: "descripcion", label: "Descripción", className: gvTableHeaderThClass },
          { key: "acciones", label: "Acción", className: gvTableActionThClass },
        ]}
      />
      <tbody>
        {fallas.map((falla) => (
          <FallaListRow key={falla.id} falla={falla} onDetail={onDetail} />
        ))}
      </tbody>
    </GestionVehiculosTable>
  );
}
