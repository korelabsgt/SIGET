"use client";

import { Fuel } from "lucide-react";
import { Trash, Trash2 } from "lucide";
import { toast } from "react-toastify";

import {
  GestionVehiculosTable,
  GestionVehiculosTableEmpty,
  GestionVehiculosThead,
  GestionVehiculosActionCell,
  gvTableActionTdClass,
  gvTableActionThClass,
} from "../../gestion-vehiculos/lib/table-ui";
import { GvTableMorphRow } from "../../gestion-vehiculos/lib/gv-table-morph-row";
import { GvSigetActionButton, sigetAccent } from "../../gestion-vehiculos/lib/gv-siget-action-button";

import type { RequisicionRow } from "./lib/zod";
import {
  formatDenominacion,
  formatFondoLabel,
  formatRangoCupones,
  formatRequisicionFecha,
} from "./lib/helpers";
import { useEliminarRequisicionCombustible } from "./lib/hooks";

function RequisicionRowItem({
  row,
  canDelete,
}: {
  row: RequisicionRow;
  canDelete: boolean;
}) {
  const eliminar = useEliminarRequisicionCombustible();

  const handleDelete = async () => {
    const res = await eliminar.mutateAsync(row.id);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Requisición eliminada");
  };

  return (
    <GvTableMorphRow>
      <td className="px-4 py-3 align-middle text-sm font-semibold">{formatFondoLabel(row.fondo)}</td>
      <td className="px-4 py-3 align-middle text-sm tabular-nums">
        {formatDenominacion(row.denominacion)}
      </td>
      <td className="px-4 py-3 align-middle text-sm tabular-nums">
        {formatRangoCupones(row.cupon_del, row.cupon_al)}
      </td>
      <td className="px-4 py-3 align-middle text-sm tabular-nums">
        {row.disponibles} / {row.cantidad}
      </td>
      <td className="px-4 py-3 align-middle text-sm tabular-nums">
        {row.ultimo_entregado ?? "—"}
      </td>
      <td className="px-4 py-3 align-middle text-sm tabular-nums">
        {formatRequisicionFecha(row.created_at)}
      </td>
      {canDelete ? (
        <td className={gvTableActionTdClass}>
          <GestionVehiculosActionCell>
            <GvSigetActionButton
              label="Quitar"
              accentColor={sigetAccent.quitar}
              morphFrom={Trash2}
              morphTo={Trash}
              onClick={() => void handleDelete()}
              disabled={eliminar.isPending}
              ariaLabel="Eliminar requisición"
              className="w-auto shrink-0"
            />
          </GestionVehiculosActionCell>
        </td>
      ) : null}
    </GvTableMorphRow>
  );
}

export function RequisicionesList({
  requisiciones,
  canDelete,
}: {
  requisiciones: RequisicionRow[];
  canDelete: boolean;
}) {
  if (requisiciones.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<Fuel className="size-10" strokeWidth={1.75} />}
        title="Sin requisiciones"
        description="Registre un lote de cupones para comenzar a aprobar solicitudes."
      />
    );
  }

  return (
    <GestionVehiculosTable>
      <GestionVehiculosThead
        cells={[
          { key: "fondo", label: "Fondo" },
          { key: "denominacion", label: "Denominación" },
          { key: "rango", label: "Rango" },
          { key: "disponibles", label: "Disponibles" },
          { key: "ultimo", label: "Último entregado" },
          { key: "registro", label: "Registro" },
          ...(canDelete
            ? [{ key: "acciones", label: "Acciones", className: gvTableActionThClass }]
            : []),
        ]}
      />
      <tbody>
        {requisiciones.map((row) => (
          <RequisicionRowItem key={row.id} row={row} canDelete={canDelete} />
        ))}
      </tbody>
    </GestionVehiculosTable>
  );
}
