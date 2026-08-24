"use client";

import { useState } from "react";
import { ArrowRight, Eye } from "lucide";
import { type FallaRow } from "./lib/zod";
import { GvMorphIcon } from "../lib/morph-icon";
import {
  estadoFallaBadgeClass,
  formatEstadoFallaLabel,
  formatSeveridadLabel,
  formatVehiculoFalla,
  severidadBadgeClass,
} from "./lib/helpers";

export function FallaCard({
  falla,
  onDetail,
}: {
  falla: FallaRow;
  onDetail: (falla: FallaRow) => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="flex flex-col rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
      data-morph-hover-scope
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-base font-bold text-foreground">
          {formatVehiculoFalla(falla)}
        </p>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoFallaBadgeClass(falla.estado)}`}
        >
          {formatEstadoFallaLabel(falla.estado)}
        </span>
      </div>
      <span
        className={`mt-2 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${severidadBadgeClass(falla.severidad)}`}
      >
        {formatSeveridadLabel(falla.severidad)}
      </span>
      <p className="mt-3 line-clamp-3 text-sm text-foreground">{falla.descripcion}</p>
      <div className="mt-4 flex justify-end border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => onDetail(falla)}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-celeste-trifinio px-3.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          aria-label={`Ver avería de ${formatVehiculoFalla(falla)}`}
        >
          <GvMorphIcon icon={Eye} hoverIcon={ArrowRight} size={14} externalHover={hover} />
          Ver
        </button>
      </div>
    </div>
  );
}
