"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type BitacoraRow } from "./lib/zod";
import { CalendarDays, MapPin, User, Route, Fuel, Receipt, Car, BookOpen } from "lucide-react";
import {
  GestionVehiculosTable,
  GestionVehiculosTableEmpty,
  GestionVehiculosThead,
  GestionVehiculosTr,
} from "../lib/table-ui";

export function BitacorasList({ bitacoras }: { bitacoras: BitacoraRow[] }) {
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
    <GestionVehiculosTable minWidth={980}>
      <GestionVehiculosThead
        cells={[
          { key: "fecha", label: "Fecha / destino" },
          { key: "vehiculo", label: "Vehículo / conductor" },
          { key: "recorrido", label: "Recorrido" },
          { key: "combustible", label: "Combustible", className: "text-right" },
        ]}
      />
      <tbody>{bitacoras.map((b) => (
        <GestionVehiculosTr
          key={b.id}
          cells={[
            {
              key: "fecha",
              className: "align-top",
              content: (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-3.5 shrink-0 text-celeste-trifinio" />
                    <span className="font-semibold text-foreground">
                      {format(new Date(b.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-xs leading-tight text-muted-foreground">{b.destino}</span>
                  </div>
                </div>
              ),
            },
            {
              key: "vehiculo",
              className: "align-top",
              content: (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Car className="size-3.5 shrink-0 text-celeste-trifinio" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      {b.ter_vehiculos?.placa}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="max-w-[150px] truncate text-xs text-muted-foreground" title={b.profiles?.nombre}>
                      {b.profiles?.nombre || "Desconocido"}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              key: "recorrido",
              className: "align-top",
              content: (
                <div className="flex flex-col gap-1.5">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-sky-50/80 px-2 py-1 text-xs font-semibold text-azul-trifinio dark:bg-sky-950/30">
                    <Route className="size-3" />
                    {b.km_recorrido} km
                  </span>
                  <div className="mt-1 flex gap-2 text-[10px] font-medium text-muted-foreground">
                    <span>In: {b.km_inicial}</span>
                    <span>•</span>
                    <span>Out: {b.km_final}</span>
                  </div>
                </div>
              ),
            },
            {
              key: "combustible",
              className: "align-top text-right",
              content: (
                <div className="flex flex-col items-end gap-1.5">
                  {b.monto_combustible > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      <Fuel className="size-3" />
                      Q. {b.monto_combustible.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-xs italic text-muted-foreground">Sin recarga</span>
                  )}
                  {b.vale_combustible ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      <Receipt className="size-3" />
                      Vale: {b.vale_combustible}
                    </span>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      ))}</tbody>
    </GestionVehiculosTable>
  );
}
