"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBitacora,
  getBitacoras,
  getConductores,
  getMetricasBitacoras,
  getSolicitudesEnMision,
} from "./actions";
import { getVehiculos } from "../../flota/lib/actions";
import type { BitacoraInput } from "./zod";

const BITACORAS_KEY = ["ter-bitacoras"];

export function useBitacoras() {
  return useQuery({
    queryKey: BITACORAS_KEY,
    queryFn: getBitacoras,
  });
}

export function useMetricasBitacoras() {
  return useQuery({
    queryKey: [...BITACORAS_KEY, "metricas"],
    queryFn: getMetricasBitacoras,
  });
}

export function useBitacoraFormOptions(enabled: boolean) {
  return useQuery({
    queryKey: [...BITACORAS_KEY, "form-options"],
    queryFn: async () => {
      const [conductores, vehiculos, misiones] = await Promise.all([
        getConductores(),
        getVehiculos(),
        getSolicitudesEnMision(),
      ]);
      return { conductores, vehiculos, misiones };
    },
    enabled,
  });
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
