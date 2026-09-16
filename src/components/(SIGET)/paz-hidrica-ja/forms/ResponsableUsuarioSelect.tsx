"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  ModalInput,
  ModalLabel,
  modalFieldClass,
} from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";
import type { DerivacionInstitucional } from "../lib/catalogos";
import { buscarInstitucionesJa, institucionAsignablePorId } from "../lib/helpers";

export function ResponsableUsuarioSelect({
  id,
  value,
  onChange,
  required,
  actor,
}: {
  id: string;
  value: string;
  onChange: (institucionId: string, nombre: string) => void;
  required?: boolean;
  actor?: DerivacionInstitucional;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState("");
  const seleccionada = value ? institucionAsignablePorId(value) : undefined;
  const resultados = buscarInstitucionesJa(query, actor);

  useEffect(() => {
    if (!abierto) return;

    const cerrar = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setAbierto(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  const abrir = () => {
    setAbierto(true);
    setQuery("");
  };

  const elegir = (institucionId: string, nombre: string) => {
    onChange(institucionId, nombre);
    setAbierto(false);
    setQuery("");
  };

  const limpiar = () => {
    onChange("", "");
    setQuery("");
  };

  return (
    <div ref={rootRef} className="space-y-2.5">
      <ModalLabel htmlFor={id}>Unidad institucional asignada</ModalLabel>

      {required ? (
        <input type="hidden" id={id} name={id} value={value} required={!value} />
      ) : null}

      {!abierto ? (
        <button
          type="button"
          onClick={abrir}
          className={cn(
            "flex h-10 w-full cursor-pointer items-center justify-between rounded-lg bg-transparent px-3 text-sm outline-none transition-colors",
            modalFieldClass,
            seleccionada ? "text-foreground" : "text-zinc-400 dark:text-zinc-500",
          )}
        >
          <span className="truncate text-left">
            {seleccionada?.nombre ?? "Buscar institución…"}
          </span>
          <Search className="size-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
        </button>
      ) : (
        <ModalInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe al menos 3 letras"
          autoFocus
          autoComplete="off"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={listboxId}
        />
      )}

      {seleccionada && !abierto ? (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-[12px] dark:bg-zinc-800">
          <span className="text-zinc-600 dark:text-zinc-300">
            {seleccionada.actor} · {seleccionada.municipio}
          </span>
          <button
            type="button"
            onClick={limpiar}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            aria-label="Quitar institución"
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      ) : null}

      {abierto ? (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          {query.length > 0 && query.length < 3 ? (
            <p className="px-3 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400">
              Escribe al menos 3 letras para buscar.
            </p>
          ) : null}
          {query.length >= 3 && resultados.length === 0 ? (
            <p className="px-3 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400">
              No hay coincidencias{actor ? ` para ${actor}` : ""}.
            </p>
          ) : null}
          {query.length >= 3 && resultados.length > 0 ? (
            <ul id={listboxId} role="listbox" className="max-h-40 overflow-y-auto py-1">
              {resultados.map((institucion) => (
                <li key={institucion.id} role="option">
                  <button
                    type="button"
                    onClick={() => elegir(institucion.id, institucion.nombre)}
                    className="flex w-full cursor-pointer flex-col px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {institucion.nombre}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {institucion.actor} · {institucion.municipio}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Unidad concreta del actor seleccionado que recibirá el caso.
      </p>
    </div>
  );
}
