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

type GvSolicitudDetailIntentValue = {
  pendingSolicitudId: string | null;
  openSolicitudDetail: (solicitudId: string) => void;
  clearPendingSolicitudDetail: () => void;
};

const GvSolicitudDetailIntentContext = createContext<GvSolicitudDetailIntentValue | null>(
  null,
);

export function GvSolicitudDetailIntentProvider({ children }: { children: ReactNode }) {
  const gvSection = useGvSection();
  const [pendingSolicitudId, setPendingSolicitudId] = useState<string | null>(null);

  const openSolicitudDetail = useCallback(
    (solicitudId: string) => {
      gvSection?.selectSection("solicitudes");
      setPendingSolicitudId(solicitudId);
    },
    [gvSection],
  );

  const clearPendingSolicitudDetail = useCallback(() => {
    setPendingSolicitudId(null);
  }, []);

  const value = useMemo(
    () => ({
      pendingSolicitudId,
      openSolicitudDetail,
      clearPendingSolicitudDetail,
    }),
    [pendingSolicitudId, openSolicitudDetail, clearPendingSolicitudDetail],
  );

  return (
    <GvSolicitudDetailIntentContext.Provider value={value}>
      {children}
    </GvSolicitudDetailIntentContext.Provider>
  );
}

export function useGvSolicitudDetailIntent() {
  return useContext(GvSolicitudDetailIntentContext);
}
