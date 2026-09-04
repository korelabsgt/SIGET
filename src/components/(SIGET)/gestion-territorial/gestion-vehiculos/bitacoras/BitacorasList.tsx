"use client";

import { ArrowRight, Eye } from "lucide";
import { BookOpen, Fuel, Route } from "lucide-react";
import { GvSigetActionButton, sigetAccent } from "../lib/gv-siget-action-button";
import { type BitacoraRow } from "./lib/zod";
import {
  GestionVehiculosTable,
  GestionVehiculosTableEmpty,
  GestionVehiculosThead,
  GestionVehiculosActionCell,
  gvTableActionTdClass,
  gvTableActionThClass,
} from "../lib/table-ui";
import { GvTableMorphRow } from "../lib/gv-table-morph-row";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import { formatMontoCombustibleBitacora } from "./lib/helpers";

function BitacoraListRow({
  bitacora,
  onDetail,
}: {
  bitacora: BitacoraRow;
  onDetail: (bitacora: BitacoraRow) => void;
}) {
  return (
    <GvTableMorphRow>
      <td className="px-4 py-3 align-middle">
        <p className="text-sm font-bold tabular-nums text-foreground">
          {formatFechaHoraGv(bitacora.fecha)}
        </p>
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
            {formatMontoCombustibleBitacora(Number(bitacora.monto_combustible))}
          </span>
        ) : (
          <span className="text-xs italic text-muted-foreground">Sin recarga</span>
        )}
      </td>
      <td className={gvTableActionTdClass}>
        <GestionVehiculosActionCell>
          <GvSigetActionButton
            label="Ver"
            accentColor={sigetAccent.abrir}
            morphFrom={Eye}
            morphTo={ArrowRight}
            onClick={() => onDetail(bitacora)}
            ariaLabel={`Ver bitácora a ${bitacora.destino}`}
            className="w-auto shrink-0"
          />
        </GestionVehiculosActionCell>
      </td>
    </GvTableMorphRow>
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
          { key: "acciones", label: "Acciones", className: gvTableActionThClass },
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
