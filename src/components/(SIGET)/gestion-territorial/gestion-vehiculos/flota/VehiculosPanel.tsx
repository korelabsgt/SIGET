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
  onVerReserva,
  onVerReservaIndividual,
  exportingVehiculoId = null,
  onDelete,
  canManage,
  canDelete,
}: {
  vehiculos: VehiculoRow[];
  rowOffset?: number;
  onEdit: (vehiculo: VehiculoRow) => void;
  onOpenGaleria: (vehiculo: VehiculoRow) => void;
  onExportExcel: (vehiculo: VehiculoRow) => void;
  onVerReserva: (vehiculo: VehiculoRow) => void;
  onVerReservaIndividual: (vehiculo: VehiculoRow) => void;
  exportingVehiculoId?: string | null;
  onDelete: (vehiculo: VehiculoRow) => Promise<boolean>;
  canManage: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="flex w-full flex-col">
      <div className="hidden w-full flex-col lg:flex">
        <VehiculosList
          vehiculos={vehiculos}
          rowOffset={rowOffset}
          onEdit={onEdit}
          onOpenGaleria={onOpenGaleria}
          onExportExcel={onExportExcel}
          onVerReserva={onVerReserva}
          onVerReservaIndividual={onVerReservaIndividual}
          exportingVehiculoId={exportingVehiculoId}
          canManage={canManage}
        />
      </div>

      <div className="flex w-full flex-col lg:hidden">
        <VehiculosCards
          vehiculos={vehiculos}
          onEdit={onEdit}
          onOpenGaleria={onOpenGaleria}
          onExportExcel={onExportExcel}
          onVerReserva={onVerReserva}
          onVerReservaIndividual={onVerReservaIndividual}
          exportingVehiculoId={exportingVehiculoId}
          onDelete={(vehiculo) => {
            void onDelete(vehiculo);
          }}
          canManage={canManage}
          canDelete={canDelete}
        />
      </div>
    </div>
  );
}
