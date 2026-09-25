"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GV_QUERY_OPTIONS, shareInflight } from "../../../gestion-vehiculos/lib/query";
import { BITACORA_PENDIENTE_BLOQUEOS_KEY } from "../../../gestion-vehiculos/lib/bitacora-pendiente-hooks";
import { VALES_COMBUSTIBLE_KEY } from "../../vales/lib/hooks";
import {
  createSolicitudCombustible,
  getSolicitudesCombustible,
  resolverSolicitudCombustible,
} from "./actions";
import type {
  ResolverSolicitudCombustibleInput,
  SolicitudCombustibleInput,
} from "./zod";

export const SOLICITUDES_COMBUSTIBLE_KEY = ["ot-solicitud-combustible"] as const;

export function useSolicitudesCombustible() {
  return useQuery({
    queryKey: SOLICITUDES_COMBUSTIBLE_KEY,
    queryFn: () => shareInflight("ot-solicitud-combustible", getSolicitudesCombustible),
    ...GV_QUERY_OPTIONS,
  });
}

export function useInvalidateSolicitudesCombustible() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: SOLICITUDES_COMBUSTIBLE_KEY });
    void qc.invalidateQueries({ queryKey: BITACORA_PENDIENTE_BLOQUEOS_KEY });
  };
}

export function useCrearSolicitudCombustible() {
  const invalidate = useInvalidateSolicitudesCombustible();
  return useMutation({
    mutationFn: (input: SolicitudCombustibleInput) => createSolicitudCombustible(input),
    onSuccess: invalidate,
  });
}

export function useResolverSolicitudCombustible() {
  const qc = useQueryClient();
  const invalidate = useInvalidateSolicitudesCombustible();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ResolverSolicitudCombustibleInput;
    }) => resolverSolicitudCombustible(id, input),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        qc.refetchQueries({ queryKey: SOLICITUDES_COMBUSTIBLE_KEY, type: "all" }),
        variables.input.accion === "APROBAR"
          ? qc.refetchQueries({ queryKey: VALES_COMBUSTIBLE_KEY, type: "all" })
          : Promise.resolve(),
      ]);
      invalidate();
    },
  });
}
