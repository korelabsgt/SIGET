"use client";

import {
  useContext,
  useLayoutEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { cn } from "@/lib/utils";

import { BITACORAS_KEY } from "../bitacoras/lib/hooks";
import { VEHICULOS_KEY } from "../flota/lib/hooks";
import { FALLAS_KEY } from "../mantenimiento/lib/hooks";
import { SOLICITUDES_KEY, VEHICULOS_DISPONIBLES_KEY } from "../solicitudes/lib/hooks";
import { hasGvDemoData, toggleGvDemoData } from "./dev-seed-actions";

const GV_DEMO_DATA_KEY = ["gv-demo-data-active"] as const;
import { isSuperRole } from "./permissions";
import { GvHeaderExtrasContainerContext } from "./gv-page-chrome";

const seedButtonClass =
  "inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30";

function GvDevDataSeedButton() {
  const qc = useQueryClient();

  const { data: demoActive = false } = useQuery({
    queryKey: GV_DEMO_DATA_KEY,
    queryFn: hasGvDemoData,
  });

  const toggle = useMutation({
    mutationFn: toggleGvDemoData,
    onSuccess: (result) => {
      if (!result.success) {
        toast.warn(result.error ?? "No se pudo alternar los datos demo.");
        return;
      }

      qc.setQueryData(GV_DEMO_DATA_KEY, result.mode === "seeded");

      void Promise.all([
        qc.invalidateQueries({ queryKey: GV_DEMO_DATA_KEY }),
        qc.invalidateQueries({ queryKey: VEHICULOS_KEY }),
        qc.invalidateQueries({ queryKey: SOLICITUDES_KEY }),
        qc.invalidateQueries({ queryKey: VEHICULOS_DISPONIBLES_KEY }),
        qc.invalidateQueries({ queryKey: BITACORAS_KEY }),
        qc.invalidateQueries({ queryKey: FALLAS_KEY }),
      ]);

      if (result.mode === "cleared") {
        const r = result.removed;
        toast.success(
          `Datos demo eliminados: ${r?.vehiculos ?? 0} vehículos, ${r?.solicitudes ?? 0} solicitudes, ${r?.bitacoras ?? 0} bitácoras, ${r?.fallas ?? 0} averías.`,
        );
        return;
      }

      const c = result.created;
      toast.success(
        `Datos demo creados: ${c?.vehiculos ?? 0} vehículos, ${c?.solicitudes ?? 0} solicitudes, ${c?.bitacoras ?? 0} bitácoras, ${c?.fallas ?? 0} averías.`,
      );
    },
    onError: () => {
      toast.error("No se pudo alternar los datos demo.");
    },
  });

  const active = demoActive;

  return (
    <button
      type="button"
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      className={cn(
        seedButtonClass,
        "cursor-pointer",
        active &&
          "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30",
      )}
      title={
        active
          ? "Quitar vehículos, solicitudes, bitácoras y averías demo"
          : "Crear registros demo de vista previa"
      }
    >
      {toggle.isPending ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
      ) : active ? (
        <Trash2 className="size-3.5 shrink-0" />
      ) : (
        <Database className="size-3.5 shrink-0" />
      )}
      {active ? "Quitar datos" : "Simular datos"}
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
