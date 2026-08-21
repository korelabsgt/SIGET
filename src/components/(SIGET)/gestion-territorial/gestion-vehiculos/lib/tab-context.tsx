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

type GvTabContextValue = {
  tab: GvSubmoduloId;
  selectTab: (id: GvSubmoduloId) => void;
};

const GvTabContext = createContext<GvTabContextValue | null>(null);

export function tabFromPathname(pathname: string): GvSubmoduloId {
  if (pathname.includes("/solicitudes")) return "solicitudes";
  if (pathname.includes("/bitacoras")) return "bitacoras";
  if (pathname.includes("/mantenimiento")) return "mantenimiento";
  return "flota";
}

export const GV_SUBMODULO_TITLES: Record<GvSubmoduloId, string> = {
  flota: "Gestión de Flota Vehicular - SIGET",
  solicitudes: "Solicitudes de Vehículos - SIGET",
  bitacoras: "Bitácora Digital - SIGET",
  mantenimiento: "Mantenimiento y Averías - SIGET",
};

export function GvTabProvider({
  tab,
  selectTab,
  children,
}: {
  tab: GvSubmoduloId;
  selectTab: (id: GvSubmoduloId) => void;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ tab, selectTab }), [tab, selectTab]);
  return <GvTabContext.Provider value={value}>{children}</GvTabContext.Provider>;
}

export function useGvSubmoduloTab() {
  return useContext(GvTabContext);
}
