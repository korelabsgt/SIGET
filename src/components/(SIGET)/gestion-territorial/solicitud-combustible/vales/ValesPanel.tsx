"use client";

import type { FondoCombustible, ValeLoteRow } from "./lib/zod";
import { ValesCards } from "./ValesCards";
import { ValesList } from "./ValesList";

export function ValesPanel({
  vales,
  canDelete,
  fondoActivo,
}: {
  vales: ValeLoteRow[];
  canDelete: boolean;
  fondoActivo: FondoCombustible;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="hidden min-h-0 flex-1 flex-col lg:flex">
        <ValesList vales={vales} canDelete={canDelete} fondoActivo={fondoActivo} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <ValesCards vales={vales} canDelete={canDelete} fondoActivo={fondoActivo} />
      </div>
    </div>
  );
}
