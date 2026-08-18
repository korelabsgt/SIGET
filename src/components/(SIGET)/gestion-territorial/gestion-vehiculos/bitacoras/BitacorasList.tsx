"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type BitacoraRow } from "./lib/zod";
import { CalendarDays, MapPin, User, Route, Fuel, Receipt, Car } from "lucide-react";

interface BitacorasListProps {
  bitacoras: BitacoraRow[];
}

export function BitacorasList({ bitacoras }: BitacorasListProps) {
  if (bitacoras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Route className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-black text-foreground">No hay bitácoras registradas</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Aún no se ha registrado ningún viaje en la bitácora digital.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              <th className="px-6 py-4 w-1/4">FECHA / DESTINO</th>
              <th className="px-6 py-4 w-1/4">VEHÍCULO / CONDUCTOR</th>
              <th className="px-6 py-4 w-1/4">RECORRIDO</th>
              <th className="px-6 py-4 text-right">COMBUSTIBLE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium text-foreground dark:divide-zinc-800">
            {bitacoras.map((b) => (
              <tr key={b.id} className="transition-colors hover:bg-muted/50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="font-bold text-foreground">
                        {format(new Date(b.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground leading-tight">
                        {b.destino}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="font-bold uppercase text-[11px] tracking-wider">
                        {b.ter_vehiculos?.placa}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={b.profiles?.full_name}>
                        {b.profiles?.full_name || "Desconocido"}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 w-fit">
                      {b.km_recorrido} km
                    </span>
                    <div className="flex gap-2 text-[10px] text-muted-foreground font-medium mt-1">
                      <span>In: {b.km_inicial}</span>
                      <span>•</span>
                      <span>Out: {b.km_final}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    {b.monto_combustible > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <Fuel className="h-3 w-3" />
                        Q. {b.monto_combustible.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Sin recarga</span>
                    )}
                    {b.vale_combustible && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        <Receipt className="h-3 w-3" />
                        Vale: {b.vale_combustible}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
