"use client";

import { Loader2 } from "lucide";
import { GvModalInset, GvModalShell } from "../lib/gv-modal-shell";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaHoraGv } from "../lib/gv-fechas";
import { formatEstadoLabel } from "../solicitudes/lib/helpers";
import { type VehiculoRow } from "./lib/zod";
import { useReservasVehiculoHoy } from "./lib/hooks";

export function ReservaVehiculoModal({
  open,
  onClose,
  vehiculo,
}: {
  open: boolean;
  onClose: () => void;
  vehiculo: VehiculoRow | null;
}) {
  const vehiculoId = vehiculo?.id ?? null;
  const { data: reservas = [], isLoading, isError, error } = useReservasVehiculoHoy(
    vehiculoId,
    open && Boolean(vehiculoId),
  );

  if (!vehiculo) return null;

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title="Reserva del vehículo"
      subtitle={`${vehiculo.placa} · ${vehiculo.marca} ${vehiculo.modelo}`}
      maxWidth="max-w-md"
      fullHeight={false}
    >
      <GvModalInset className="pb-6">
        {isLoading ? (
          <div className="flex min-h-[8rem] items-center justify-center text-celeste-trifinio">
            <span className="inline-flex animate-spin">
              <GvMorphIcon icon={Loader2} size={28} morphOnHover={false} />
            </span>
          </div>
        ) : isError ? (
          <p className="text-sm text-red-500">
            {error instanceof Error ? error.message : "No se pudo cargar la reserva."}
          </p>
        ) : reservas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay una solicitud activa asociada a este vehículo para el día de hoy.
          </p>
        ) : (
          <ul className="space-y-4">
            {reservas.map((reserva) => (
              <li
                key={reserva.id}
                className="rounded-2xl border border-border bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/80"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-celeste-trifinio">
                  {formatEstadoLabel(reserva.estado)}
                </p>
                <p className="mt-2 text-base font-semibold capitalize text-foreground">
                  {reserva.destino}
                </p>
                <dl className="mt-3 space-y-2.5 text-sm">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Reservado por
                    </dt>
                    <dd className="mt-0.5 font-semibold text-foreground">
                      {reserva.solicitanteNombre}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Del
                    </dt>
                    <dd className="mt-0.5 text-foreground">
                      {formatFechaHoraGv(reserva.fechaInicio)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Al
                    </dt>
                    <dd className="mt-0.5 text-foreground">
                      {formatFechaHoraGv(reserva.fechaFinEstimada)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </GvModalInset>
    </GvModalShell>
  );
}
