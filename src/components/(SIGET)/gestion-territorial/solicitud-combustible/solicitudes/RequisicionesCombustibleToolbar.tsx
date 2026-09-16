"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
} from "../../gestion-vehiculos/lib/gv-header-ui";
import { formatVehiculoOpcion } from "../../gestion-vehiculos/flota/lib/helpers";

import { TODOS_VEHICULOS_REQUISICION } from "../requisiciones/lib/helpers";
import type { SolicitudCombustibleRow } from "./lib/zod";

const filtroTriggerClass = cn(
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
  "h-11 min-w-[11rem] max-w-[min(22rem,36vw)] cursor-pointer px-3 data-[size=default]:h-11 focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25",
);

const filtroContentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

const filtroItemClass =
  "cursor-pointer rounded-lg bg-white font-medium text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800";

export function RequisicionesCombustibleToolbar({
  vehiculoFilter,
  onVehiculoFilterChange,
  vehiculosParaFiltro,
}: {
  vehiculoFilter: string;
  onVehiculoFilterChange: (value: string) => void;
  vehiculosParaFiltro: NonNullable<SolicitudCombustibleRow["vehiculo"]>[];
}) {
  return (
    <div className="flex w-full min-w-0 flex-row flex-wrap items-center justify-start gap-2">
      <Select value={vehiculoFilter} onValueChange={onVehiculoFilterChange}>
        <SelectTrigger className={filtroTriggerClass}>
          <SelectValue placeholder="Todos los vehículos" />
        </SelectTrigger>
        <SelectContent position="popper" className={filtroContentClass}>
          <SelectItem
            value={TODOS_VEHICULOS_REQUISICION}
            textValue="Todos los vehículos"
            className={filtroItemClass}
          >
            Todos los vehículos
          </SelectItem>
          {vehiculosParaFiltro.map((vehiculo) => {
            const label = formatVehiculoOpcion(vehiculo);
            return (
              <SelectItem
                key={vehiculo.id}
                value={vehiculo.id}
                textValue={label}
                className={filtroItemClass}
              >
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
