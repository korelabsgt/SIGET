"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DpiSugerencia } from "./lib/actions";
import { useDpisSugerencias } from "./lib/hooks";
import { normalizarDpiInput } from "./lib/zod";

const inputClass =
  "flex h-10 w-full rounded-lg border-2 border-celeste-trifinio bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30";

export function BusquedaDpi({
  value,
  onChange,
  onSeleccionar,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSeleccionar: (sugerencia: DpiSugerencia) => void;
  disabled?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setConsulta(value), 280);
    return () => window.clearTimeout(timer);
  }, [value]);

  const digitos = value.replace(/\D/g, "");
  const { data: sugerencias = [], isFetching } = useDpisSugerencias(consulta);
  const mostrarLista =
    abierto && digitos.length >= 3 && (isFetching || sugerencias.length > 0);

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(normalizarDpiInput(e.target.value))}
        onFocus={() => setAbierto(true)}
        onBlur={() => {
          window.setTimeout(() => setAbierto(false), 160);
        }}
        className={inputClass}
        maxLength={13}
        autoFocus
        disabled={disabled}
      />

      <AnimatePresence>
        {mostrarLista ? (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border-2 border-celeste-trifinio bg-zinc-100 py-1 dark:bg-zinc-900"
          >
            {isFetching ? (
              <li className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-celeste-trifinio" />
                Buscando DPI…
              </li>
            ) : (
              sugerencias.map((item) => (
                <li key={item.dpi}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSeleccionar(item);
                      setAbierto(false);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2.5 text-left transition-colors",
                      "hover:bg-celeste-trifinio/10 active:bg-celeste-trifinio/15",
                    )}
                  >
                    <span className="font-mono text-xs font-bold tabular-nums text-foreground">
                      {item.dpi}
                    </span>
                    <span className="truncate text-sm font-semibold text-muted-foreground">
                      {item.nombre}
                    </span>
                  </button>
                </li>
              ))
            )}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
