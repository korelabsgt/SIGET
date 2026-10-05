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
  pendingBitacoraId: string | null;
  openFlotaVehiculo: (vehiculoId: string) => void;
  openMantenimientoFalla: (fallaId: string) => void;
  openBitacoraPendiente: (bitacoraId: string) => void;
  clearPendingFlotaVehiculo: () => void;
  clearPendingMantenimientoFalla: () => void;
  clearPendingBitacora: () => void;
};

const GvPanelActionIntentContext = createContext<GvPanelActionIntentValue | null>(null);

export function GvPanelActionIntentProvider({ children }: { children: ReactNode }) {
  const gvSection = useGvSection();
  const [pendingFlotaVehiculoId, setPendingFlotaVehiculoId] = useState<string | null>(null);
  const [pendingMantenimientoFallaId, setPendingMantenimientoFallaId] = useState<string | null>(
    null,
  );
  const [pendingBitacoraId, setPendingBitacoraId] = useState<string | null>(null);

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

  const openBitacoraPendiente = useCallback(
    (bitacoraId: string) => {
      gvSection?.selectSection("bitacoras");
      setPendingBitacoraId(bitacoraId);
    },
    [gvSection],
  );

  const clearPendingBitacora = useCallback(() => {
    setPendingBitacoraId(null);
  }, []);

  const value = useMemo(
    () => ({
      pendingFlotaVehiculoId,
      pendingMantenimientoFallaId,
      pendingBitacoraId,
      openFlotaVehiculo,
      openMantenimientoFalla,
      openBitacoraPendiente,
      clearPendingFlotaVehiculo,
      clearPendingMantenimientoFalla,
      clearPendingBitacora,
    }),
    [
      pendingFlotaVehiculoId,
      pendingMantenimientoFallaId,
      pendingBitacoraId,
      openFlotaVehiculo,
      openMantenimientoFalla,
      openBitacoraPendiente,
      clearPendingFlotaVehiculo,
      clearPendingMantenimientoFalla,
      clearPendingBitacora,
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
