import { Eye, CalendarRange } from "lucide-react";
import { type SolicitudRow } from "./lib/zod";
import {
  GestionVehiculosTable,
  GestionVehiculosTableEmpty,
  GestionVehiculosThead,
  GestionVehiculosTr,
} from "../lib/table-ui";
import { formatFechaHoraGt } from "@/lib/fechas-gt";
import { estadoBadgeClass, formatEstadoLabel } from "./lib/helpers";

export function SolicitudesList({
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
    <GestionVehiculosTable minWidth={900}>
      <GestionVehiculosThead
        cells={[
          { key: "solicitante", label: "Solicitante" },
          { key: "salida", label: "Fecha de salida" },
          { key: "estado", label: "Estado" },
          { key: "vehiculo", label: "Vehículo" },
          { key: "acciones", label: "Acciones", className: "text-center" },
        ]}
      />
      <tbody>
        {solicitudes.map((sol) => (
          <GestionVehiculosTr
            key={sol.id}
            cells={[
              {
                key: "solicitante",
                className: "align-middle",
                content: (
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {sol.solicitante?.nombre || "Desconocido"}
                    </p>
                    {sol.solicitante?.email ? (
                      <p className="truncate text-xs text-muted-foreground">{sol.solicitante.email}</p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "salida",
                className: "whitespace-nowrap align-middle text-sm font-semibold tabular-nums text-foreground",
                content: formatFechaHoraGt(sol.fecha_inicio),
              },
              {
                key: "estado",
                className: "whitespace-nowrap align-middle",
                content: (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoBadgeClass(sol.estado)}`}
                  >
                    {formatEstadoLabel(sol.estado)}
                  </span>
                ),
              },
              {
                key: "vehiculo",
                className: "align-middle",
                content: sol.vehiculo ? (
                  <span className="text-xs text-muted-foreground">
                    {sol.vehiculo.placa} · {sol.vehiculo.marca} {sol.vehiculo.modelo}
                  </span>
                ) : (
                  <span className="text-xs italic text-muted-foreground">Sin asignar</span>
                ),
              },
              {
                key: "acciones",
                className: "align-middle text-center",
                content: (
                  <button
                    type="button"
                    onClick={() => onDetail(sol)}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-celeste-trifinio px-3.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                    aria-label={`Detalle de solicitud a ${sol.destino}`}
                  >
                    <Eye className="size-3.5" />
                    Detalle
                  </button>
                ),
              },
            ]}
          />
        ))}
      </tbody>
    </GestionVehiculosTable>
  );
}
