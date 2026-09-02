"use client";

import { motion } from "framer-motion";
import { ArrowRight, Eye } from "lucide";
import { Car, Fuel, MapPin, Route } from "lucide-react";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { formatFechaTablaGt, formatHoraTablaGt } from "@/lib/fechas-gt";
import {
  GV_LIST_CARD_CHIP_CLASS,
  GV_LIST_CARD_CLASS,
  GV_LIST_CARD_FOOTER_CLASS,
  GV_LIST_CARD_ICON_BOX_CLASS,
  GV_LIST_CARD_SECTION_CLASS,
} from "../lib/detalle-ui";
import { formatMontoCombustibleBitacora } from "./lib/helpers";
import { type BitacoraRow } from "./lib/zod";

export function BitacoraCard({
  bitacora,
  onDetail,
  index = 0,
}: {
  bitacora: BitacoraRow;
  onDetail: (bitacora: BitacoraRow) => void;
  index?: number;
}) {
  const vehiculo = bitacora.ter_vehiculos;
  const combustible = formatMontoCombustibleBitacora(Number(bitacora.monto_combustible));
  const tieneCombustible = Number(bitacora.monto_combustible) > 0;

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
          <MapPin className="h-5 w-5 text-sky-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">
            {bitacora.profiles?.nombre || "Desconocido"}
          </p>
          <div className="mt-0.5 tabular-nums">
            <p className="text-xs font-semibold text-foreground">{formatFechaTablaGt(bitacora.fecha)}</p>
            <p className="text-xs font-semibold text-celeste-trifinio">
              {formatHoraTablaGt(bitacora.fecha)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-sky-500/10 px-2 py-1 text-xs font-bold text-sky-600 dark:text-sky-400">
            <Route className="size-3" />
            {bitacora.km_recorrido.toLocaleString("es-GT")} km
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
              tieneCombustible
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-zinc-100 text-muted-foreground dark:bg-zinc-800"
            }`}
          >
            <Fuel className="size-3 shrink-0" />
            {combustible}
          </span>
        </div>
      </div>

      <div className={GV_LIST_CARD_SECTION_CLASS}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Destino</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p
            className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-foreground"
            title={bitacora.destino}
          >
            {bitacora.destino}
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
          onClick={() => onDetail(bitacora)}
          ariaLabel={`Ver bitácora a ${bitacora.destino}`}
          className="w-auto shrink-0"
        />
      </div>
    </motion.div>
  );
}
