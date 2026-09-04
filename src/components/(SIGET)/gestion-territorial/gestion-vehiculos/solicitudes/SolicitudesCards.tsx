import { CalendarRange } from "lucide-react";
import { type SolicitudRow } from "./lib/zod";
import { SolicitudCard } from "./SolicitudCard";
import { GestionVehiculosTableEmpty } from "../lib/table-ui";
import { GvMobileRecordList } from "../lib/gv-mobile-record";

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
    <GvMobileRecordList>
      {solicitudes.map((solicitud) => (
        <SolicitudCard key={solicitud.id} solicitud={solicitud} onDetail={onDetail} />
      ))}
    </GvMobileRecordList>
  );
}
