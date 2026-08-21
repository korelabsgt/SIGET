import { type VehiculoRow } from "./lib/zod";
import { VehiculoCard } from "./VehiculoCard";

export function VehiculosCards({
  vehiculos,
  onDetail,
  onEdit,
  onDelete,
}: {
  vehiculos: VehiculoRow[];
  onDetail: (vehiculo: VehiculoRow) => void;
  onEdit: (vehiculo: VehiculoRow) => void;
  onDelete: (vehiculo: VehiculoRow) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {vehiculos.map((vehiculo) => (
        <VehiculoCard
          key={vehiculo.id}
          vehiculo={vehiculo}
          onDetail={() => onDetail(vehiculo)}
          onEdit={() => onEdit(vehiculo)}
          onDelete={() => onDelete(vehiculo)}
        />
      ))}
    </div>
  );
}
