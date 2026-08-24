"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  ModalShell,
  ModalLabel,
  ModalInput,
  ModalTextarea,
  ModalSubmit,
  ModalFooter,
} from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";
import {
  AtenderFallaSchema,
  type AtenderFallaFormData,
  SolventarFallaSchema,
  type SolventarFallaFormData,
  type FallaRow,
  type MecanicoOption,
} from "../lib/zod";
import { useAtenderFalla, useSolventarFalla } from "../lib/hooks";

function MecanicoBuscar({
  mecanicos,
  value,
  onChange,
}: {
  mecanicos: MecanicoOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = mecanicos.find((mecanico) => mecanico.id === value);
  const normalized = query.trim().toLocaleLowerCase("es");
  const results = useMemo(() => {
    if (normalized.length < 3) return [];
    return mecanicos
      .filter((mecanico) =>
        (mecanico.nombre ?? "").toLocaleLowerCase("es").includes(normalized),
      )
      .sort((a, b) =>
        (a.nombre ?? "").localeCompare(b.nombre ?? "", "es", { sensitivity: "base" }),
      )
      .slice(0, 20);
  }, [mecanicos, normalized]);

  const showHint = query.trim().length > 0 && query.trim().length < 3;
  const showEmpty = normalized.length >= 3 && results.length === 0 && !selected;

  return (
    <div className="space-y-2">
      <div className="relative">
        <ModalInput
          id="mecanico_id"
          autoComplete="off"
          value={selected ? (selected.nombre ?? "") : query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange("");
          }}
        />
        {selected ? (
          <button
            type="button"
            aria-label="Quitar mecánico"
            onClick={() => {
              setQuery("");
              onChange("");
            }}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg border-0 bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      {showHint ? (
        <p className="text-xs text-muted-foreground">Escribe al menos 3 letras para buscar.</p>
      ) : null}
      <AnimatePresence mode="popLayout" initial={false}>
        {results.length > 0 ? (
          <motion.ul
            key="mecanico-results"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 opacity-100 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {results.map((mecanico) => (
              <motion.li key={mecanico.id} layout>
                <button
                  type="button"
                  onClick={() => {
                    onChange(mecanico.id);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center rounded-lg border-0 bg-white px-3 py-2 text-left text-sm text-zinc-900 hover:bg-sky-50",
                    "dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
                  )}
                >
                  {mecanico.nombre ?? "Sin nombre"}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        ) : null}
        {showEmpty ? (
          <motion.p
            key="mecanico-empty"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            No hay coincidencias.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function VerEditar({
  open,
  onClose,
  modo,
  falla,
  mecanicos,
}: {
  open: boolean;
  onClose: () => void;
  modo: "atender" | "solventar" | null;
  falla: FallaRow;
  mecanicos: MecanicoOption[];
}) {
  const atender = useAtenderFalla();
  const solventar = useSolventarFalla();

  const formAtender = useForm<AtenderFallaFormData>({
    resolver: zodResolver(AtenderFallaSchema),
    values: {
      falla_id: falla.id,
      mecanico_id: "",
      taller_externo: "",
    },
  });

  const formSolventar = useForm<SolventarFallaFormData>({
    resolver: zodResolver(SolventarFallaSchema),
    values: {
      falla_id: falla.id,
      diagnostico: "",
      reparacion_detalle: "",
    },
  });

  async function onAtender(data: AtenderFallaFormData) {
    try {
      await atender.mutateAsync(data);
      toast.success("El vehículo pasó a reparación.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la avería.");
    }
  }

  async function onSolventar(data: SolventarFallaFormData) {
    try {
      await solventar.mutateAsync(data);
      toast.success("Avería solventada.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo solventar la avería.");
    }
  }

  const isAtender = modo === "atender";
  const pending = isAtender ? atender.isPending : solventar.isPending;

  return (
    <ModalShell
      open={open && modo !== null}
      onClose={onClose}
      title={isAtender ? "Iniciar reparación" : "Finalizar reparación"}
      subtitle={isAtender ? "Asignar atención a la avería" : "Registrar diagnóstico y reparación"}
    >
      {isAtender ? (
        <form onSubmit={formAtender.handleSubmit(onAtender)} className="space-y-4">
          <div className="space-y-2">
            <ModalLabel htmlFor="mecanico_id">Mecánico interno</ModalLabel>
            <Controller
              name="mecanico_id"
              control={formAtender.control}
              render={({ field }) => (
                <MecanicoBuscar
                  mecanicos={mecanicos}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            {formAtender.formState.errors.mecanico_id ? (
              <p className="text-xs text-red-500">{formAtender.formState.errors.mecanico_id.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <ModalLabel htmlFor="taller_externo">Taller externo</ModalLabel>
            <ModalInput id="taller_externo" {...formAtender.register("taller_externo")} />
          </div>
          <ModalFooter>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              Cancelar
            </button>
            <ModalSubmit disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Pasar a reparación
            </ModalSubmit>
          </ModalFooter>
        </form>
      ) : (
        <form onSubmit={formSolventar.handleSubmit(onSolventar)} className="space-y-4">
          <div className="space-y-2">
            <ModalLabel htmlFor="diagnostico">Diagnóstico técnico</ModalLabel>
            <ModalTextarea id="diagnostico" rows={3} {...formSolventar.register("diagnostico")} />
            {formSolventar.formState.errors.diagnostico ? (
              <p className="text-xs text-red-500">{formSolventar.formState.errors.diagnostico.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <ModalLabel htmlFor="reparacion_detalle">Detalle de la reparación</ModalLabel>
            <ModalTextarea
              id="reparacion_detalle"
              rows={4}
              {...formSolventar.register("reparacion_detalle")}
            />
            {formSolventar.formState.errors.reparacion_detalle ? (
              <p className="text-xs text-red-500">{formSolventar.formState.errors.reparacion_detalle.message}</p>
            ) : null}
          </div>
          <ModalFooter>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              Cancelar
            </button>
            <ModalSubmit disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Solventar avería
            </ModalSubmit>
          </ModalFooter>
        </form>
      )}
    </ModalShell>
  );
}
