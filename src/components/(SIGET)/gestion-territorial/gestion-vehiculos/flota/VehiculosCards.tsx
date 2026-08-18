import { type VehiculoRow } from "./lib/zod";
import { VehiculoCard } from "./VehiculoCard";

export function VehiculosCards({
  vehiculos,
  onEdit,
  onDelete,
}: {
  vehiculos: VehiculoRow[];
  onEdit: (vehiculo: VehiculoRow) => void;
  onDelete: (vehiculo: VehiculoRow) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehiculos.map((vehiculo) => (
        <VehiculoCard
          key={vehiculo.id}
          vehiculo={vehiculo}
          onEdit={() => onEdit(vehiculo)}
          onDelete={() => onDelete(vehiculo)}
        />
      ))}
    </div>
  );
}
