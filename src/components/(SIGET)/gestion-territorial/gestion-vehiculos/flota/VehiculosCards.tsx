import { type VehiculoRow } from "./lib/zod";
import { VehiculoCard } from "./VehiculoCard";

export function VehiculosCards({
  vehiculos,
  onDetail,
  onEdit,
  onDelete,
  canManage,
}: {
  vehiculos: VehiculoRow[];
  onDetail: (vehiculo: VehiculoRow) => void;
  onEdit: (vehiculo: VehiculoRow) => void;
  onDelete: (vehiculo: VehiculoRow) => void;
  canManage: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {vehiculos.map((vehiculo, index) => (
        <VehiculoCard
          key={vehiculo.id}
          vehiculo={vehiculo}
          onDetail={() => onDetail(vehiculo)}
          onEdit={() => onEdit(vehiculo)}
          onDelete={() => onDelete(vehiculo)}
          canManage={canManage}
          index={index}
        />
      ))}
    </div>
  );
}
