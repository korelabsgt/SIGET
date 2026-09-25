"use client";

import { Fuel } from "lucide-react";

import { GestionVehiculosTableEmpty } from "../../gestion-vehiculos/lib/table-ui";
import { GvMobileRecordList } from "../../gestion-vehiculos/lib/gv-mobile-record";

import type { FondoCombustible, ValeLoteRow } from "./lib/zod";
import { ValeLoteCard } from "./ValeLoteCard";

export function ValesCards({
  vales,
  canDelete,
  fondoActivo,
}: {
  vales: ValeLoteRow[];
  canDelete: boolean;
  fondoActivo: FondoCombustible;
}) {
  if (vales.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<Fuel className="size-10" strokeWidth={1.75} />}
        title={`Sin lotes (${fondoActivo})`}
        description={`Registre un talonario de cupones para el fondo ${fondoActivo}.`}
      />
    );
  }

  return (
    <GvMobileRecordList>
      {vales.map((row) => (
        <ValeLoteCard key={row.id} row={row} canDelete={canDelete} hideFondo />
      ))}
    </GvMobileRecordList>
  );
}
