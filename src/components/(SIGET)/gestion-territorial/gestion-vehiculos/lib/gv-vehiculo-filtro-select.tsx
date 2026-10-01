"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatVehiculoOpcion } from "../flota/lib/helpers";

type VehiculoFiltroOption = Parameters<typeof formatVehiculoOpcion>[0] & {
  id?: string | null;
};
import {
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_SEARCH_INPUT_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
} from "./gv-header-ui";

export const GV_TODOS_VEHICULOS = "__todos__";

const contentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] border border-border bg-white p-0 opacity-100 shadow-lg dark:bg-zinc-900";

const itemClass =
  "cursor-pointer rounded-lg bg-white font-medium text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800";

const defaultTriggerClass = cn(
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
  "cursor-pointer px-3 data-[size=default]:h-11 focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25",
);

export function GvVehiculoFiltroSelect({
  value,
  onValueChange,
  vehiculos,
  canViewAll,
  triggerClassName,
  todosValue = GV_TODOS_VEHICULOS,
}: {
  value: string;
  onValueChange: (value: string) => void;
  vehiculos: VehiculoFiltroOption[];
  canViewAll: boolean;
  triggerClassName?: string;
  todosValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const todosLabel = canViewAll ? "Todos los vehículos" : "Mis vehículos";

  const vehiculosFiltrados = useMemo(() => {
    const conId = vehiculos.filter((v) => v.id);
    const q = query.trim().toLowerCase();
    if (!q) return conId;
    return conId.filter((v) => {
      const label = formatVehiculoOpcion(v).toLowerCase();
      return (
        label.includes(q) ||
        v.placa.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q)
      );
    });
  }, [vehiculos, query]);

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <SelectTrigger className={cn(defaultTriggerClass, triggerClassName)}>
        <SelectValue placeholder={todosLabel} />
      </SelectTrigger>
      <SelectContent position="popper" className={contentClass}>
        <div
          className="sticky top-0 z-10 border-b border-border bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
          onPointerDown={(event) => event.preventDefault()}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-celeste-trifinio" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder="Buscar placa o vehículo…"
              aria-label="Buscar vehículo en la lista"
              className={cn(GV_TABLE_SEARCH_INPUT_CLASS, "h-9 pl-8 text-sm")}
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          <SelectItem value={todosValue} textValue={todosLabel} className={itemClass}>
            {todosLabel}
          </SelectItem>
          {vehiculosFiltrados.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              Sin coincidencias
            </p>
          ) : (
            vehiculosFiltrados.map((v) => {
              const label = formatVehiculoOpcion(v);
              return (
                <SelectItem
                  key={v.id}
                  value={v.id as string}
                  textValue={label}
                  className={itemClass}
                >
                  {label}
                </SelectItem>
              );
            })
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
