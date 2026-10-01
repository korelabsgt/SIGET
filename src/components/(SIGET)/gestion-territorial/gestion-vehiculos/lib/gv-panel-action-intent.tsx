"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGvSection } from "./tab-context";

type GvPanelActionIntentValue = {
  pendingFlotaVehiculoId: string | null;
  pendingMantenimientoFallaId: string | null;
  openFlotaVehiculo: (vehiculoId: string) => void;
  openMantenimientoFalla: (fallaId: string) => void;
  clearPendingFlotaVehiculo: () => void;
  clearPendingMantenimientoFalla: () => void;
};

const GvPanelActionIntentContext = createContext<GvPanelActionIntentValue | null>(null);

export function GvPanelActionIntentProvider({ children }: { children: ReactNode }) {
  const gvSection = useGvSection();
  const [pendingFlotaVehiculoId, setPendingFlotaVehiculoId] = useState<string | null>(null);
  const [pendingMantenimientoFallaId, setPendingMantenimientoFallaId] = useState<string | null>(
    null,
  );

  const openFlotaVehiculo = useCallback(
    (vehiculoId: string) => {
      gvSection?.selectSection("flota");
      setPendingFlotaVehiculoId(vehiculoId);
    },
    [gvSection],
  );

  const openMantenimientoFalla = useCallback(
    (fallaId: string) => {
      gvSection?.selectSection("mantenimiento");
      setPendingMantenimientoFallaId(fallaId);
    },
    [gvSection],
  );

  const clearPendingFlotaVehiculo = useCallback(() => {
    setPendingFlotaVehiculoId(null);
  }, []);

  const clearPendingMantenimientoFalla = useCallback(() => {
    setPendingMantenimientoFallaId(null);
  }, []);

  const value = useMemo(
    () => ({
      pendingFlotaVehiculoId,
      pendingMantenimientoFallaId,
      openFlotaVehiculo,
      openMantenimientoFalla,
      clearPendingFlotaVehiculo,
      clearPendingMantenimientoFalla,
    }),
    [
      pendingFlotaVehiculoId,
      pendingMantenimientoFallaId,
      openFlotaVehiculo,
      openMantenimientoFalla,
      clearPendingFlotaVehiculo,
      clearPendingMantenimientoFalla,
    ],
  );

  return (
    <GvPanelActionIntentContext.Provider value={value}>
      {children}
    </GvPanelActionIntentContext.Provider>
  );
}

export function useGvPanelActionIntent() {
  return useContext(GvPanelActionIntentContext);
}
