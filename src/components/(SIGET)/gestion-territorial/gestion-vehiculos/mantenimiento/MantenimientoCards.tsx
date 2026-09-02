import { Wrench } from "lucide-react";
import { type FallaRow } from "./lib/zod";
import { FallaCard } from "./FallaCard";
import { GestionVehiculosTableEmpty } from "../lib/table-ui";

export function MantenimientoCards({
  fallas,
  onDetail,
}: {
  fallas: FallaRow[];
  onDetail: (falla: FallaRow) => void;
}) {
  if (fallas.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<Wrench className="size-10" />}
        title="No hay registros"
        description="No se encontraron averías en esta categoría."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {fallas.map((falla, index) => (
        <FallaCard key={falla.id} falla={falla} onDetail={onDetail} index={index} />
      ))}
    </div>
  );
}
