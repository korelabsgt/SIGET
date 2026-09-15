"use client";

import { Fuel } from "lucide-react";

import { GestionVehiculosTableEmpty } from "../../gestion-vehiculos/lib/table-ui";
import { GvMobileRecordList } from "../../gestion-vehiculos/lib/gv-mobile-record";

import type { ValeLoteRow } from "./lib/zod";
import { ValeLoteCard } from "./ValeLoteCard";

export function ValesCards({
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
    <GvMobileRecordList>
      {vales.map((row) => (
        <ValeLoteCard key={row.id} row={row} canDelete={canDelete} />
      ))}
    </GvMobileRecordList>
  );
}
