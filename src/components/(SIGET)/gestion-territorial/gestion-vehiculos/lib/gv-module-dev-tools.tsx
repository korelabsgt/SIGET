"use client";

import {
  useContext,
  useLayoutEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { cn } from "@/lib/utils";

import { BITACORAS_KEY } from "../bitacoras/lib/hooks";
import { VEHICULOS_KEY } from "../flota/lib/hooks";
import { FALLAS_KEY } from "../mantenimiento/lib/hooks";
import { SOLICITUDES_KEY, VEHICULOS_DISPONIBLES_KEY } from "../solicitudes/lib/hooks";
import { seedGvDemoData } from "./dev-seed-actions";
import { isSuperRole } from "./permissions";
import { GvHeaderExtrasContainerContext } from "./gv-page-chrome";

const seedButtonClass =
  "inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30";

function GvDevDataSeedButton() {
  const qc = useQueryClient();

  const seed = useMutation({
    mutationFn: seedGvDemoData,
    onSuccess: (result) => {
      if (!result.success) {
        toast.warn(result.error ?? "No se pudieron generar los datos demo.");
        return;
      }

      void Promise.all([
        qc.invalidateQueries({ queryKey: VEHICULOS_KEY }),
        qc.invalidateQueries({ queryKey: SOLICITUDES_KEY }),
        qc.invalidateQueries({ queryKey: VEHICULOS_DISPONIBLES_KEY }),
        qc.invalidateQueries({ queryKey: BITACORAS_KEY }),
        qc.invalidateQueries({ queryKey: FALLAS_KEY }),
      ]);

      const c = result.created;
      toast.success(
        `Datos demo creados: ${c?.vehiculos ?? 0} vehículos, ${c?.solicitudes ?? 0} solicitudes, ${c?.bitacoras ?? 0} bitácoras, ${c?.fallas ?? 0} averías.`,
      );
    },
    onError: () => {
      toast.error("No se pudieron generar los datos demo.");
    },
  });

  return (
    <button
      type="button"
      onClick={() => seed.mutate()}
      disabled={seed.isPending}
      className={cn(seedButtonClass, "cursor-pointer")}
    >
      {seed.isPending ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
      ) : (
        <Database className="size-3.5 shrink-0" />
      )}
      Simular datos
    </button>
  );
}

export function GvModuleDevTools() {
  const { realRole } = useUserContext();
  const containerRef = useContext(GvHeaderExtrasContainerContext);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalTarget(containerRef?.current ?? null);
  });

  if (!isSuperRole(realRole) || !portalTarget) return null;

  return createPortal(<GvDevDataSeedButton />, portalTarget);
}
