"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  ModalField,
  ModalLabel,
  modalFieldClass,
} from "@/components/ui/general-modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUsuariosParaAsignar } from "../lib/hooks";
import type { UsuarioAsignar } from "../lib/actions";

function normalizarBusqueda(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function SelectEncargado({
  value,
  onChange,
  opciones,
}: {
  value: string;
  onChange: (id: string) => void;
  opciones: UsuarioAsignar[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const elegido = opciones.find((o) => o.id === value);
  const filtered = useMemo(() => {
    const q = normalizarBusqueda(query.trim());
    if (!q) return opciones;
    return opciones.filter((o) => normalizarBusqueda(o.nombre).includes(q));
  }, [opciones, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-transparent px-3 py-2 text-left text-sm outline-none",
            modalFieldClass,
            !elegido && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {elegido?.nombre ?? "Buscar usuario…"}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[210] w-[var(--radix-popover-trigger-width)] border-celeste-trifinio/30 bg-white p-0 opacity-100 dark:bg-zinc-900"
      >
        <div className="border-b border-border p-2 dark:border-zinc-700">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-lg border-2 border-celeste-trifinio bg-transparent pl-8 pr-3 text-sm outline-none"
              autoFocus
            />
          </div>
        </div>
        <ul className="max-h-52 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">
              Sin coincidencias
            </li>
          ) : (
            filtered.map((opt) => {
              const selected = opt.id === value;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-celeste-trifinio/10",
                      selected && "bg-celeste-trifinio/15 font-semibold",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-3.5 shrink-0 text-celeste-trifinio",
                        !selected && "opacity-0",
                      )}
                    />
                    <span className="truncate">{opt.nombre}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function CampoAsignarActividad({
  open,
  enabled,
  asignar,
  onAsignarChange,
  encargadoId,
  onEncargadoChange,
  excludeId,
}: {
  open: boolean;
  enabled: boolean;
  asignar: boolean;
  onAsignarChange: (v: boolean) => void;
  encargadoId: string;
  onEncargadoChange: (id: string) => void;
  excludeId?: string | null;
}) {
  const { data: usuarios = [] } = useUsuariosParaAsignar(open && enabled);

  const opciones = useMemo(
    () =>
      excludeId ? usuarios.filter((u) => u.id !== excludeId) : usuarios,
    [usuarios, excludeId],
  );

  if (!enabled) return null;

  return (
    <ModalField>
      <div className="flex items-center justify-between gap-3">
        <ModalLabel>Asignar a otro</ModalLabel>
        <Switch
          checked={asignar}
          onCheckedChange={(v) => {
            onAsignarChange(v);
            if (!v) onEncargadoChange("");
          }}
          aria-label="Asignar la actividad a otra persona"
          className="shadow-none data-[state=checked]:bg-celeste-trifinio data-[state=unchecked]:bg-zinc-300 dark:data-[state=unchecked]:bg-zinc-600"
        />
      </div>
      <AnimatePresence initial={false}>
        {asignar ? (
          <motion.div
            key="encargado"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <SelectEncargado
              value={encargadoId}
              onChange={onEncargadoChange}
              opciones={opciones}
            />
          </motion.div>
        ) : (
          <p className="text-xs text-muted-foreground">
            La actividad quedará en tus actividades.
          </p>
        )}
      </AnimatePresence>
    </ModalField>
  );
}
