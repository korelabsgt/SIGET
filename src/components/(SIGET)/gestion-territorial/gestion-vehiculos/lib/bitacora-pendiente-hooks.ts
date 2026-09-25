"use client";

import { useQuery } from "@tanstack/react-query";
import { GV_QUERY_OPTIONS, shareInflight } from "./query";
import { getBitacoraPendienteBloqueos } from "./bitacora-pendiente-actions";

export const BITACORA_PENDIENTE_BLOQUEOS_KEY = ["gv-bitacora-pendiente-bloqueos"] as const;

export function useBitacoraPendienteBloqueos() {
  return useQuery({
    queryKey: BITACORA_PENDIENTE_BLOQUEOS_KEY,
    queryFn: () =>
      shareInflight("gv-bitacora-pendiente-bloqueos", getBitacoraPendienteBloqueos),
    ...GV_QUERY_OPTIONS,
  });
}
