"use client";

import { Trash, Trash2 } from "lucide";
import { Fuel, Ticket } from "lucide-react";
import { toast } from "react-toastify";

import { GvSigetActionButton, sigetAccent } from "../../gestion-vehiculos/lib/gv-siget-action-button";
import { formatFechaHoraGv } from "../../gestion-vehiculos/lib/gv-fechas";
import {
  GvMobileRecordBadge,
  GvMobileRecordFooter,
  GvMobileRecordHeader,
  GvMobileRecordMeta,
  GvMobileRecordMetaRow,
  GvMobileRecordRow,
} from "../../gestion-vehiculos/lib/gv-mobile-record";

import type { ValeLoteRow } from "./lib/zod";
import {
  formatDenominacion,
  formatFondoLabel,
  formatRangoCupones,
} from "./lib/helpers";
import { useEliminarValeCombustible } from "./lib/hooks";

export function ValeLoteCard({
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
    <GvMobileRecordRow>
      <GvMobileRecordHeader
        title={
          <p className="truncate font-semibold text-foreground">
            {formatFondoLabel(row.fondo)} · {formatDenominacion(row.denominacion)}
          </p>
        }
        badge={
          <GvMobileRecordBadge className="bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
            {row.disponibles} / {row.cantidad} disp.
          </GvMobileRecordBadge>
        }
      />

      <GvMobileRecordMeta>
        <GvMobileRecordMetaRow icon={<Ticket className="size-3.5 text-celeste-trifinio" />}>
          <span className="font-semibold tabular-nums">
            {formatRangoCupones(row.cupon_del, row.cupon_al)}
          </span>
        </GvMobileRecordMetaRow>
        <GvMobileRecordMetaRow icon={<Fuel className="size-3.5 text-celeste-trifinio" />}>
          Último entregado:{" "}
          <span className="font-semibold tabular-nums">{row.ultimo_entregado ?? "—"}</span>
        </GvMobileRecordMetaRow>
      </GvMobileRecordMeta>

      <GvMobileRecordFooter
        left={
          <span className="tabular-nums font-semibold text-foreground">
            {formatFechaHoraGv(row.created_at)}
          </span>
        }
        right={
          canDelete ? (
            <GvSigetActionButton
              label="Eliminar"
              accentColor={sigetAccent.quitar}
              morphFrom={Trash2}
              morphTo={Trash}
              onClick={() => void handleDelete()}
              disabled={eliminar.isPending}
              ariaLabel="Eliminar lote de vales"
              className="h-8 w-auto shrink-0 rounded-lg px-3"
            />
          ) : null
        }
      />
    </GvMobileRecordRow>
  );
}
