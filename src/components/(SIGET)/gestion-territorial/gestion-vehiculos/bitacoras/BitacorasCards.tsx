import { BookOpen } from "lucide-react";
import { type BitacoraRow } from "./lib/zod";
import { BitacoraCard } from "./BitacoraCard";
import { GestionVehiculosTableEmpty } from "../lib/table-ui";

export function BitacorasCards({
  bitacoras,
  onDetail,
}: {
  bitacoras: BitacoraRow[];
  onDetail: (bitacora: BitacoraRow) => void;
}) {
  if (bitacoras.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<BookOpen className="size-10" />}
        title="Sin bitácoras"
        description="Aún no se ha registrado ningún viaje en la bitácora digital."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {bitacoras.map((bitacora, index) => (
        <BitacoraCard
          key={bitacora.id}
          bitacora={bitacora}
          onDetail={onDetail}
          index={index}
        />
      ))}
    </div>
  );
}
