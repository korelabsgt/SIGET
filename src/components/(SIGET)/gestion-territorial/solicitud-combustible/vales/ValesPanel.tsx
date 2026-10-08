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
    <div className="flex w-full flex-col">
      <div className="hidden w-full flex-col lg:flex">
        <ValesList vales={vales} canDelete={canDelete} fondoActivo={fondoActivo} />
      </div>
      <div className="flex w-full flex-col lg:hidden">
        <ValesCards vales={vales} canDelete={canDelete} fondoActivo={fondoActivo} />
      </div>
    </div>
  );
}
