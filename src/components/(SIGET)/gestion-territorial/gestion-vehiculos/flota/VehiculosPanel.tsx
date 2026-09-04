"use client";

import { VehiculosList } from "./VehiculosList";
import { VehiculosCards } from "./VehiculosCards";
import { type VehiculoRow } from "./lib/zod";

export function VehiculosPanel({
  vehiculos,
  rowOffset = 0,
  onEdit,
  onOpenGaleria,
  onExportExcel,
  exportingVehiculoId = null,
  onDelete,
  canManage,
}: {
  vehiculos: VehiculoRow[];
  rowOffset?: number;
  onEdit: (vehiculo: VehiculoRow) => void;
  onOpenGaleria: (vehiculo: VehiculoRow) => void;
  onExportExcel: (vehiculo: VehiculoRow) => void;
  exportingVehiculoId?: string | null;
  onDelete: (vehiculo: VehiculoRow) => Promise<boolean>;
  canManage: boolean;
}) {
  return (
    <>
      <div className="hidden lg:block">
        <VehiculosList
          vehiculos={vehiculos}
          rowOffset={rowOffset}
          onEdit={onEdit}
          onOpenGaleria={onOpenGaleria}
          onExportExcel={onExportExcel}
          exportingVehiculoId={exportingVehiculoId}
          canManage={canManage}
        />
      </div>

      <div className="lg:hidden">
        <VehiculosCards
          vehiculos={vehiculos}
          onEdit={onEdit}
          onOpenGaleria={onOpenGaleria}
          onExportExcel={onExportExcel}
          exportingVehiculoId={exportingVehiculoId}
          onDelete={(vehiculo) => {
            void onDelete(vehiculo);
          }}
          canManage={canManage}
        />
      </div>
    </>
  );
}
