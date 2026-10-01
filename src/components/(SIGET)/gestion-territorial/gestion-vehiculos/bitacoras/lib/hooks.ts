"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmarBitacora,
  listCombustiblesAprobadosSinMisionPorVehiculo,
  sincronizarBitacorasPendientesMisionesActivas,
} from "./actions";
import { GV_QUERY_OPTIONS, shareInflight } from "../../lib/query";
import { fetchBitacoras } from "../../lib/client-db";
import { useVehiculos, VEHICULOS_KEY } from "../../flota/lib/hooks";
import { SOLICITUDES_KEY } from "../../solicitudes/lib/hooks";
import { BITACORA_PENDIENTE_BLOQUEOS_KEY } from "../../lib/bitacora-pendiente-hooks";
import type { BitacoraInput } from "./zod";

export const BITACORAS_KEY = ["ter-bitacoras"];

export function useBitacoras() {
  return useQuery({
    queryKey: BITACORAS_KEY,
    queryFn: async () => {
      await shareInflight(
        "ter-bitacoras-sync-pendientes",
        sincronizarBitacorasPendientesMisionesActivas,
      );
      return shareInflight("ter-bitacoras", fetchBitacoras);
    },
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
      const delMes = bitacoras.filter(
        (b) =>
          b.estado !== "PENDIENTE" &&
          new Date(b.fecha).getTime() >= startOfMonth,
      );
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

export function useCombustiblesSinMisionBitacora(vehiculoId: string, enabled: boolean) {
  const id = vehiculoId.trim();
  return useQuery({
    queryKey: [...BITACORAS_KEY, "combustible-sin-mision", id],
    queryFn: () => listCombustiblesAprobadosSinMisionPorVehiculo(id),
    enabled: enabled && id.length > 0,
    ...GV_QUERY_OPTIONS,
  });
}

export function useBitacoraFormOptions(enabled: boolean) {
  const vehiculosQuery = useVehiculos();

  return {
    data: enabled
      ? {
          vehiculos: vehiculosQuery.data ?? [],
        }
      : undefined,
    isLoading: enabled && vehiculosQuery.isLoading,
  };
}

export function useConfirmarBitacora() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BitacoraInput }) =>
      confirmarBitacora(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BITACORAS_KEY });
      qc.invalidateQueries({ queryKey: SOLICITUDES_KEY });
      qc.invalidateQueries({ queryKey: VEHICULOS_KEY });
      qc.invalidateQueries({ queryKey: BITACORA_PENDIENTE_BLOQUEOS_KEY });
    },
  });
}
