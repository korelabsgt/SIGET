import { type VehiculoRow } from "./lib/zod";
import { VehiculoCard } from "./VehiculoCard";
import { GvMobileRecordList } from "../lib/gv-mobile-record";

export function VehiculosCards({
  vehiculos,
  onEdit,
  onOpenGaleria,
  onExportExcel,
  exportingVehiculoId = null,
  onDelete,
  canManage,
}: {
  vehiculos: VehiculoRow[];
  onEdit: (vehiculo: VehiculoRow) => void;
  onOpenGaleria: (vehiculo: VehiculoRow) => void;
  onExportExcel: (vehiculo: VehiculoRow) => void;
  exportingVehiculoId?: string | null;
  onDelete: (vehiculo: VehiculoRow) => void;
  canManage: boolean;
}) {
  return (
    <GvMobileRecordList>
      {vehiculos.map((vehiculo) => (
        <VehiculoCard
          key={vehiculo.id}
          vehiculo={vehiculo}
          onEdit={() => onEdit(vehiculo)}
          onOpenGaleria={() => onOpenGaleria(vehiculo)}
          onExportExcel={() => onExportExcel(vehiculo)}
          exporting={exportingVehiculoId === (vehiculo.id ?? vehiculo.placa)}
          onDelete={() => onDelete(vehiculo)}
          canManage={canManage}
        />
      ))}
    </GvMobileRecordList>
  );
}
