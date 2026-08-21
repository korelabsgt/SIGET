"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBitacora } from "./actions";
import { GV_QUERY_OPTIONS, shareInflight } from "../../lib/query";
import {
  fetchBitacoras,
  fetchPerfilesNombre,
  fetchSolicitudesEnMision,
} from "../../lib/client-db";
import { useVehiculos } from "../../flota/lib/hooks";
import type { BitacoraInput } from "./zod";

export const BITACORAS_KEY = ["ter-bitacoras"];

export function useBitacoras() {
  return useQuery({
    queryKey: BITACORAS_KEY,
    queryFn: () => shareInflight("ter-bitacoras", fetchBitacoras),
    ...GV_QUERY_OPTIONS,
  });
}

export function useMetricasBitacoras() {
  return useQuery({
    queryKey: [...BITACORAS_KEY, "metricas"],
    queryFn: async () => {
      const bitacoras = await shareInflight("ter-bitacoras", fetchBitacoras);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const delMes = bitacoras.filter((b) => new Date(b.fecha).getTime() >= startOfMonth);
      return {
        total_km: delMes.reduce((acc, curr) => acc + (curr.km_recorrido || 0), 0),
        total_combustible: delMes.reduce(
          (acc, curr) => acc + (Number(curr.monto_combustible) || 0),
          0,
        ),
        total_misiones: delMes.length,
      };
    },
    ...GV_QUERY_OPTIONS,
  });
}

export function useBitacoraFormOptions(enabled: boolean) {
  const vehiculosQuery = useVehiculos();
  const extras = useQuery({
    queryKey: [...BITACORAS_KEY, "form-options"],
    queryFn: async () => {
      const [conductores, misiones] = await Promise.all([
        shareInflight("ter-perfiles-nombre", fetchPerfilesNombre),
        shareInflight("ter-solicitudes-en-mision", fetchSolicitudesEnMision),
      ]);
      return { conductores, misiones };
    },
    enabled,
    ...GV_QUERY_OPTIONS,
  });

  return {
    data:
      extras.data !== undefined
        ? {
            conductores: extras.data.conductores,
            misiones: extras.data.misiones,
            vehiculos: vehiculosQuery.data ?? [],
          }
        : undefined,
    isLoading: extras.isLoading || (enabled && vehiculosQuery.isLoading),
  };
}

export function useCrearBitacora() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BitacoraInput) => createBitacora(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BITACORAS_KEY });
    },
  });
}
