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

import type { ValeLoteRow } from "./lib/zod";
import {
  formatDenominacion,
  formatFondoLabel,
  formatRangoCupones,
  formatValeLoteFecha,
} from "./lib/helpers";
import { useEliminarValeCombustible } from "./lib/hooks";

function ValeLoteRowItem({
  row,
  canDelete,
}: {
  row: ValeLoteRow;
  canDelete: boolean;
}) {
  const eliminar = useEliminarValeCombustible();

  const handleDelete = async () => {
    const res = await eliminar.mutateAsync(row.id);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Lote eliminado");
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
        {formatValeLoteFecha(row.created_at)}
      </td>
      {canDelete ? (
        <td className={gvTableActionTdClass}>
          <GestionVehiculosActionCell>
            <GvSigetActionButton
              label="Eliminar"
              accentColor={sigetAccent.quitar}
              morphFrom={Trash2}
              morphTo={Trash}
              onClick={() => void handleDelete()}
              disabled={eliminar.isPending}
              ariaLabel="Eliminar lote de vales"
              className="w-auto shrink-0"
            />
          </GestionVehiculosActionCell>
        </td>
      ) : null}
    </GvTableMorphRow>
  );
}

export function ValesList({
  vales,
  canDelete,
}: {
  vales: ValeLoteRow[];
  canDelete: boolean;
}) {
  if (vales.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<Fuel className="size-10" strokeWidth={1.75} />}
        title="Sin lotes de vales"
        description="Registre un talonario de cupones para poder aprobar solicitudes."
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
        {vales.map((row) => (
          <ValeLoteRowItem key={row.id} row={row} canDelete={canDelete} />
        ))}
      </tbody>
    </GestionVehiculosTable>
  );
}
