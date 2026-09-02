"use client";

import { motion } from "framer-motion";
import { ArrowRight, Eye } from "lucide";
import { AlertTriangle, Car, Wrench } from "lucide-react";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { formatFechaTablaGt, formatHoraTablaGt } from "@/lib/fechas-gt";
import {
  GV_LIST_CARD_CHIP_CLASS,
  GV_LIST_CARD_CLASS,
  GV_LIST_CARD_FOOTER_CLASS,
  GV_LIST_CARD_ICON_BOX_CLASS,
  GV_LIST_CARD_SECTION_CLASS,
} from "../lib/detalle-ui";
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
  index = 0,
}: {
  falla: FallaRow;
  onDetail: (falla: FallaRow) => void;
  index?: number;
}) {
  const vehiculo = falla.vehiculo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={GV_LIST_CARD_CLASS}
      data-morph-hover-scope
    >
      <div className="flex items-start gap-3">
        <div className={GV_LIST_CARD_ICON_BOX_CLASS}>
          <Wrench className="h-5 w-5 text-sky-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{falla.reportador.nombre}</p>
          <div className="mt-0.5 tabular-nums">
            <p className="text-xs font-semibold text-foreground">{formatFechaTablaGt(falla.created_at)}</p>
            <p className="text-xs font-semibold text-celeste-trifinio">
              {formatHoraTablaGt(falla.created_at)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${estadoFallaBadgeClass(falla.estado)}`}
          >
            {formatEstadoFallaLabel(falla.estado)}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${severidadBadgeClass(falla.severidad)}`}
          >
            <AlertTriangle className="size-3 shrink-0" />
            {formatSeveridadLabel(falla.severidad)}
          </span>
        </div>
      </div>

      <div className={GV_LIST_CARD_SECTION_CLASS}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avería</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p
            className="min-w-0 flex-1 line-clamp-2 text-base font-semibold leading-snug text-foreground"
            title={falla.descripcion}
          >
            {falla.descripcion}
          </p>
          {vehiculo ? (
            <span className={GV_LIST_CARD_CHIP_CLASS}>
              <Car className="size-3 shrink-0 text-celeste-trifinio" />
              <span className="truncate">
                {vehiculo.placa} · {vehiculo.marca} {vehiculo.modelo}
              </span>
            </span>
          ) : (
            <span className="ml-auto shrink-0 rounded-lg bg-zinc-100 px-2 py-0.5 text-xs italic text-muted-foreground dark:bg-zinc-800">
              Sin vehículo
            </span>
          )}
        </div>
      </div>

      <div className={GV_LIST_CARD_FOOTER_CLASS}>
        <SigetActionButton
          label="Ver"
          accentColor={sigetAccent.abrir}
          morphFrom={Eye}
          morphTo={ArrowRight}
          onClick={() => onDetail(falla)}
          ariaLabel={`Ver avería de ${vehiculo?.placa ?? "vehículo"}`}
          className="w-auto shrink-0"
        />
      </div>
    </motion.div>
  );
}
