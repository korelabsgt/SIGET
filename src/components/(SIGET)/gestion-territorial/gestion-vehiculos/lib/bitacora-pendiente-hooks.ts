"use client";

import { useQuery } from "@tanstack/react-query";
import { GV_QUERY_OPTIONS, shareInflight } from "./query";
import {
  getBitacoraPendienteBloqueos,
  getBitacoraPendienteBloqueosParaUsuario,
} from "./bitacora-pendiente-actions";

export const BITACORA_PENDIENTE_BLOQUEOS_KEY = ["gv-bitacora-pendiente-bloqueos"] as const;

export function useBitacoraPendienteBloqueos() {
  return useQuery({
    queryKey: BITACORA_PENDIENTE_BLOQUEOS_KEY,
    queryFn: () =>
      shareInflight("gv-bitacora-pendiente-bloqueos", getBitacoraPendienteBloqueos),
    ...GV_QUERY_OPTIONS,
  });
}

export function useBitacoraPendienteBloqueosParaUsuario(
  profileId: string,
  enabled: boolean,
) {
  const id = profileId.trim();
  return useQuery({
    queryKey: [...BITACORA_PENDIENTE_BLOQUEOS_KEY, id],
    queryFn: () =>
      shareInflight(`gv-bitacora-pendiente-bloqueos:${id}`, () =>
        getBitacoraPendienteBloqueosParaUsuario(id),
      ),
    enabled: enabled && id.length > 0,
    ...GV_QUERY_OPTIONS,
  });
}
