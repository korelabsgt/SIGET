"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shareInflight } from "../../../gestion-vehiculos/lib/query";
import {
  createValeCombustible,
  deleteValeCombustible,
  getValesCombustible,
} from "./actions";
import type { ValeLoteInput } from "./zod";

export const VALES_COMBUSTIBLE_KEY = ["ot-requisicion-combustible"] as const;

export function useValesCombustible() {
  return useQuery({
    queryKey: VALES_COMBUSTIBLE_KEY,
    queryFn: () => shareInflight("ot-requisicion-combustible", getValesCombustible),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useInvalidateValesCombustible() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: VALES_COMBUSTIBLE_KEY });
}

export function useCrearValeCombustible() {
  const invalidate = useInvalidateValesCombustible();
  return useMutation({
    mutationFn: (input: ValeLoteInput) => createValeCombustible(input),
    onSuccess: invalidate,
  });
}

export function useEliminarValeCombustible() {
  const invalidate = useInvalidateValesCombustible();
  return useMutation({
    mutationFn: (id: string) => deleteValeCombustible(id),
    onSuccess: invalidate,
  });
}
