import { CalendarRange } from "lucide-react";
import { type SolicitudRow } from "./lib/zod";
import { SolicitudCard } from "./SolicitudCard";
import { GestionVehiculosTableEmpty } from "../lib/table-ui";

export function SolicitudesCards({
  solicitudes,
  onDetail,
}: {
  solicitudes: SolicitudRow[];
  onDetail: (solicitud: SolicitudRow) => void;
}) {
  if (solicitudes.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<CalendarRange className="size-10" />}
        title="Sin solicitudes"
        description="No se encontraron solicitudes en este filtro."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {solicitudes.map((solicitud) => (
        <SolicitudCard key={solicitud.id} solicitud={solicitud} onDetail={onDetail} />
      ))}
    </div>
  );
}
