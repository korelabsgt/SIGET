"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import {
  GvModalFooter,
  GvModalInset,
  GvModalShell,
  ModalCancelButton,
} from "../../lib/gv-modal-shell";
import { cn } from "@/lib/utils";

export function ConsultaAveriaModal({
  open,
  onOpenChange,
  onConfirmar,
  isPending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (huboAveria: boolean) => void;
  isPending?: boolean;
}) {
  return (
    <GvModalShell
      open={open}
      onClose={() => {
        if (!isPending) onOpenChange(false);
      }}
      title="¿Hubo avería en el vehículo?"
      subtitle="Antes de registrar la bitácora, indique si el vehículo presentó alguna falla durante el viaje."
      maxWidth="max-w-md"
      fullHeight={false}
    >
      {open ? (
        <>
          <GvModalInset className="space-y-4 pb-2">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                Si hubo avería, deberá completar el reporte en mantenimiento antes de salir.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => onConfirmar(false)}
                className={cn(
                  "inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-emerald-500 bg-emerald-100 px-4 text-xs font-bold uppercase tracking-wider text-emerald-900 transition-colors hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60",
                )}
              >
                No hubo avería
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onConfirmar(true)}
                className={cn(
                  "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-500 bg-amber-100 px-4 text-xs font-bold uppercase tracking-wider text-amber-900 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/60",
                )}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <AlertTriangle className="size-4 shrink-0" />
                )}
                Sí hubo avería
              </button>
            </div>
          </GvModalInset>

          <GvModalFooter>
            <ModalCancelButton
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            />
          </GvModalFooter>
        </>
      ) : null}
    </GvModalShell>
  );
}
