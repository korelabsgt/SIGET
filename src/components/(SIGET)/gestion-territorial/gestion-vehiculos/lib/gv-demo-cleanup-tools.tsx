"use client";

import {
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { cn } from "@/lib/utils";

import { BITACORAS_KEY } from "../bitacoras/lib/hooks";
import { VEHICULOS_KEY } from "../flota/lib/hooks";
import { FALLAS_KEY } from "../mantenimiento/lib/hooks";
import {
  SOLICITUDES_KEY,
  VEHICULOS_DISPONIBLES_KEY,
} from "../solicitudes/lib/hooks";
import {
  SOLICITUDES_COMBUSTIBLE_KEY,
} from "../../solicitud-combustible/solicitudes/lib/hooks";
import { VALES_COMBUSTIBLE_KEY } from "../../solicitud-combustible/vales/lib/hooks";
import { clearGvDemoData, hasGvDemoData } from "./demo-data-cleanup";
import { GvHeaderExtrasContainerContext } from "./gv-page-chrome";
import { isSuperRole } from "./permissions";

const GV_DEMO_DATA_KEY = ["gv-demo-data-active"] as const;

const cleanupButtonClass =
  "inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30";

export function GvDemoCleanupButton({ className }: { className?: string }) {
  const qc = useQueryClient();

  const { data: demoActive = false, isLoading } = useQuery({
    queryKey: GV_DEMO_DATA_KEY,
    queryFn: hasGvDemoData,
  });

  const limpiar = useMutation({
    mutationFn: clearGvDemoData,
    onSuccess: (result) => {
      if (!result.success) {
        toast.warn(result.error ?? "No se pudieron quitar los datos demo.");
        return;
      }

      qc.setQueryData(GV_DEMO_DATA_KEY, false);

      void Promise.all([
        qc.invalidateQueries({ queryKey: GV_DEMO_DATA_KEY }),
        qc.invalidateQueries({ queryKey: VEHICULOS_KEY }),
        qc.invalidateQueries({ queryKey: SOLICITUDES_KEY }),
        qc.invalidateQueries({ queryKey: VEHICULOS_DISPONIBLES_KEY }),
        qc.invalidateQueries({ queryKey: BITACORAS_KEY }),
        qc.invalidateQueries({ queryKey: FALLAS_KEY }),
        qc.invalidateQueries({ queryKey: SOLICITUDES_COMBUSTIBLE_KEY }),
        qc.invalidateQueries({ queryKey: VALES_COMBUSTIBLE_KEY }),
      ]);

      const r = result.removed;
      toast.success(
        `Datos demo eliminados: ${r?.vehiculos ?? 0} vehículos, ${r?.solicitudes ?? 0} solicitudes, ${r?.bitacoras ?? 0} bitácoras, ${r?.fallas ?? 0} averías.`,
      );
    },
    onError: () => {
      toast.error("No se pudieron quitar los datos demo.");
    },
  });

  if (isLoading || !demoActive) return null;

  return (
    <button
      type="button"
      onClick={() => limpiar.mutate()}
      disabled={limpiar.isPending}
      className={cn(cleanupButtonClass, "cursor-pointer", className)}
      title="Quitar vehículos demo (placas que terminan en SIM) y registros vinculados"
    >
      {limpiar.isPending ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
      ) : (
        <Trash2 className="size-3.5 shrink-0" />
      )}
      Quitar demo
    </button>
  );
}

export function GvDemoCleanupPortal() {
  const { realRole } = useUserContext();
  const containerRef = useContext(GvHeaderExtrasContainerContext);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalTarget(containerRef?.current ?? null);
  });

  if (!isSuperRole(realRole) || !portalTarget) return null;

  return createPortal(<GvDemoCleanupButton />, portalTarget);
}

export function GvDemoCleanupForSuper({ children }: { children: ReactNode }) {
  const { realRole } = useUserContext();
  if (!isSuperRole(realRole)) return null;
  return children;
}
