"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { GV_QUERY_OPTIONS, shareInflight } from "../../lib/query";
import { fetchSolicitudes, fetchVehiculos } from "../../lib/client-db";
import { createSolicitud } from "./actions";
import { VEHICULOS_KEY } from "../../flota/lib/hooks";
import type { SolicitudInput } from "./zod";

export const SOLICITUDES_KEY = ["ter-solicitudes"];

export function useSolicitudes() {
  return useQuery({
    queryKey: SOLICITUDES_KEY,
    queryFn: () => shareInflight("ter-solicitudes", fetchSolicitudes),
    ...GV_QUERY_OPTIONS,
  });
}

export function useVehiculosParaSolicitud(enabled: boolean) {
  return useQuery({
    queryKey: VEHICULOS_KEY,
    queryFn: () => shareInflight("ter-vehiculos", fetchVehiculos),
    select: (vehiculos) => vehiculos.filter((v) => v.estado === "LIBRE"),
    enabled,
    ...GV_QUERY_OPTIONS,
  });
}

export function useCrearSolicitud() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: SolicitudInput) => createSolicitud(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOLICITUDES_KEY });
    },
  });
}

export function useInvalidateSolicitudes() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: SOLICITUDES_KEY });
}
