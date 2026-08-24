"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { GV_QUERY_OPTIONS, shareInflight } from "../../lib/query";
import { fetchSolicitudes, fetchVehiculosDisponibles } from "../../lib/client-db";
import { VEHICULOS_KEY } from "../../flota/lib/hooks";
import { createSolicitud } from "./actions";
import type { SolicitudInput } from "./zod";

export const SOLICITUDES_KEY = ["ter-solicitudes"];
export const VEHICULOS_DISPONIBLES_KEY = ["ter-vehiculos", "disponibles"] as const;

export function useSolicitudes() {
  return useQuery({
    queryKey: SOLICITUDES_KEY,
    queryFn: () => shareInflight("ter-solicitudes", fetchSolicitudes),
    ...GV_QUERY_OPTIONS,
  });
}

export function useVehiculosParaSolicitud(enabled: boolean) {
  return useQuery({
    queryKey: VEHICULOS_DISPONIBLES_KEY,
    queryFn: () => shareInflight("ter-vehiculos-disponibles", fetchVehiculosDisponibles),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useCrearSolicitud() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: SolicitudInput) => createSolicitud(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOLICITUDES_KEY });
      qc.invalidateQueries({ queryKey: VEHICULOS_DISPONIBLES_KEY });
      qc.invalidateQueries({ queryKey: VEHICULOS_KEY, refetchType: "all" });
    },
  });
}

export function useInvalidateSolicitudes() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: SOLICITUDES_KEY });
    qc.invalidateQueries({ queryKey: VEHICULOS_DISPONIBLES_KEY });
    qc.invalidateQueries({ queryKey: VEHICULOS_KEY, refetchType: "all" });
  };
}
