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
  gvTableBodyTdClass,
} from "../lib/table-ui";
import { GvTableMorphRow } from "../lib/gv-table-morph-row";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import { esBitacoraPendiente } from "./lib/bitacora-estado";
import { formatMontoCombustibleBitacora, nombreSolicitanteBitacora } from "./lib/helpers";

function BitacoraListRow({
  bitacora,
  onDetail,
  onConfirmarPendiente,
}: {
  bitacora: BitacoraRow;
  onDetail: (bitacora: BitacoraRow) => void;
  onConfirmarPendiente?: (bitacora: BitacoraRow) => void;
}) {
  const pendiente = esBitacoraPendiente(bitacora);
  const solicitanteNombre = nombreSolicitanteBitacora(bitacora);
  return (
    <GvTableMorphRow>
      <td className={gvTableBodyTdClass}>
        <p className="text-sm font-bold tabular-nums text-foreground">
          {formatFechaHoraGv(bitacora.fecha)}
        </p>
      </td>
      <td className={gvTableBodyTdClass}>
        <p
          className="mx-auto max-w-[180px] truncate font-semibold text-foreground"
          title={solicitanteNombre}
        >
          {solicitanteNombre}
        </p>
      </td>
      <td className={gvTableBodyTdClass}>
        {pendiente ? (
          <span className="inline-flex items-center rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-400">
            Pendiente
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50/80 px-2 py-1 text-xs font-semibold text-azul-trifinio dark:bg-sky-950/30">
            <Route className="size-3" />
            {bitacora.km_recorrido.toLocaleString("es-GT")} km
          </span>
        )}
      </td>
      <td className={gvTableBodyTdClass}>
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
  onConfirmarPendiente,
}: {
  bitacoras: BitacoraRow[];
  onDetail: (bitacora: BitacoraRow) => void;
  onConfirmarPendiente?: (bitacora: BitacoraRow) => void;
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
          { key: "solicitante", label: "Solicitante" },
          { key: "recorrido", label: "Estado" },
          { key: "combustible", label: "Combustible" },
          { key: "acciones", label: "Acciones", className: gvTableActionThClass },
        ]}
      />
      <tbody>
        {bitacoras.map((b) => (
          <BitacoraListRow
            key={b.id}
            bitacora={b}
            onDetail={onDetail}
            onConfirmarPendiente={onConfirmarPendiente}
          />
        ))}
      </tbody>
    </GestionVehiculosTable>
  );
}
