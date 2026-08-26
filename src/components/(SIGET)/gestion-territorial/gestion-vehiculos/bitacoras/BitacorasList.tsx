"use client";

import { useState } from "react";
import { ArrowRight, Eye } from "lucide";
import { BookOpen, Fuel, Route } from "lucide-react";
import { type BitacoraRow } from "./lib/zod";
import {
  GestionVehiculosTable,
  GestionVehiculosTableEmpty,
  GestionVehiculosThead,
} from "../lib/table-ui";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaTablaGt, formatHoraTablaGt } from "@/lib/fechas-gt";

function formatMontoCombustible(monto: number) {
  if (monto <= 0) return "Sin recarga";
  return `Q. ${monto.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function BitacoraListRow({
  bitacora,
  onDetail,
}: {
  bitacora: BitacoraRow;
  onDetail: (bitacora: BitacoraRow) => void;
}) {
  const [rowHover, setRowHover] = useState(false);

  return (
    <tr
      className="border-b border-border last:border-0 transition-colors hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20"
      onMouseEnter={() => setRowHover(true)}
      onMouseLeave={() => setRowHover(false)}
    >
      <td className="px-4 py-3 align-middle">
        <div className="tabular-nums">
          <p className="text-sm font-bold text-foreground">
            {formatFechaTablaGt(bitacora.fecha)}
          </p>
          <p className="text-sm font-semibold text-celeste-trifinio">
            {formatHoraTablaGt(bitacora.fecha)}
          </p>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <p
          className="max-w-[180px] truncate font-semibold text-foreground"
          title={bitacora.profiles?.nombre}
        >
          {bitacora.profiles?.nombre || "Desconocido"}
        </p>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50/80 px-2 py-1 text-xs font-semibold text-azul-trifinio dark:bg-sky-950/30">
          <Route className="size-3" />
          {bitacora.km_recorrido.toLocaleString("es-GT")} km
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        {bitacora.monto_combustible > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <Fuel className="size-3" />
            {formatMontoCombustible(Number(bitacora.monto_combustible))}
          </span>
        ) : (
          <span className="text-xs italic text-muted-foreground">Sin recarga</span>
        )}
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <button
          type="button"
          onClick={() => onDetail(bitacora)}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-celeste-trifinio px-3.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          aria-label={`Ver bitácora a ${bitacora.destino}`}
        >
          <GvMorphIcon icon={Eye} hoverIcon={ArrowRight} size={14} externalHover={rowHover} />
          Ver
        </button>
      </td>
    </tr>
  );
}

export function BitacorasList({
  bitacoras,
  onDetail,
}: {
  bitacoras: BitacoraRow[];
  onDetail: (bitacora: BitacoraRow) => void;
}) {
  if (bitacoras.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<BookOpen className="size-10" />}
        title="Sin bitácoras"
        description="Aún no se ha registrado ningún viaje en la bitácora digital."
      />
    );
  }

  return (
    <GestionVehiculosTable minWidth={760}>
      <GestionVehiculosThead
        cells={[
          { key: "fecha", label: "Fecha" },
          { key: "conductor", label: "Conductor" },
          { key: "recorrido", label: "Recorrido" },
          { key: "combustible", label: "Combustible" },
          { key: "acciones", label: "Acciones", className: "text-center" },
        ]}
      />
      <tbody>
        {bitacoras.map((b) => (
          <BitacoraListRow key={b.id} bitacora={b} onDetail={onDetail} />
        ))}
      </tbody>
    </GestionVehiculosTable>
  );
}
