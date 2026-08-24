"use client";

import { useState } from "react";
import { ArrowRight, Eye } from "lucide";
import { Wrench } from "lucide-react";
import { type FallaRow } from "./lib/zod";
import {
  GestionVehiculosTable,
  GestionVehiculosTableEmpty,
  GestionVehiculosThead,
} from "../lib/table-ui";
import { GvMorphIcon } from "../lib/morph-icon";
import {
  estadoFallaBadgeClass,
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
  const [rowHover, setRowHover] = useState(false);

  return (
    <tr
      className="border-b border-border last:border-0 transition-colors hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20"
      onMouseEnter={() => setRowHover(true)}
      onMouseLeave={() => setRowHover(false)}
    >
      <td className="px-4 py-3 align-middle">
        <p className="truncate font-semibold text-foreground">{formatVehiculoFalla(falla)}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${severidadBadgeClass(falla.severidad)}`}
        >
          {formatSeveridadLabel(falla.severidad)}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoFallaBadgeClass(falla.estado)}`}
        >
          {formatEstadoFallaLabel(falla.estado)}
        </span>
      </td>
      <td className="max-w-[28rem] px-4 py-3 align-middle">
        <p className="line-clamp-2 text-sm text-foreground" title={falla.descripcion}>
          {falla.descripcion}
        </p>
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <button
          type="button"
          onClick={() => onDetail(falla)}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-celeste-trifinio px-3.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          aria-label={`Ver avería de ${formatVehiculoFalla(falla)}`}
        >
          <GvMorphIcon icon={Eye} hoverIcon={ArrowRight} size={14} externalHover={rowHover} />
          Ver
        </button>
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
          { key: "vehiculo", label: "Vehículo" },
          { key: "severidad", label: "Severidad" },
          { key: "estado", label: "Estado" },
          { key: "descripcion", label: "Descripción" },
          { key: "acciones", label: "Acción", className: "text-center" },
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
