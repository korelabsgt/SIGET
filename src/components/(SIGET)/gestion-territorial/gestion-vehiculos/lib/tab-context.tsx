"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

export type GvSubmoduloId =
  | "flota"
  | "solicitudes"
  | "bitacoras"
  | "mantenimiento";

type GvSectionContextValue = {
  section: GvSubmoduloId;
  selectSection: (id: GvSubmoduloId) => void;
};

const GvSectionContext = createContext<GvSectionContextValue | null>(null);

export const GV_MODULE_TITLE = "Gestión de Vehículos - SIGET";

export const GV_SUBMODULO_TITLES: Record<GvSubmoduloId, string> = {
  flota: "Gestión de Flota Vehicular - SIGET",
  solicitudes: "Solicitudes de Vehículos - SIGET",
  bitacoras: "Bitácora Digital - SIGET",
  mantenimiento: "Mantenimiento y Averías - SIGET",
};

export function GvSectionProvider({
  section,
  selectSection,
  children,
}: {
  section: GvSubmoduloId;
  selectSection: (id: GvSubmoduloId) => void;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ section, selectSection }), [section, selectSection]);
  return <GvSectionContext.Provider value={value}>{children}</GvSectionContext.Provider>;
}

export function useGvSection() {
  return useContext(GvSectionContext);
}
