"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shareInflight } from "../../../gestion-vehiculos/lib/query";
import {
  createRequisicionCombustible,
  deleteRequisicionCombustible,
  getRequisicionesCombustible,
} from "./actions";
import type { RequisicionInput } from "./zod";

export const REQUISICIONES_COMBUSTIBLE_KEY = ["ot-requisicion-combustible"] as const;

export function useRequisicionesCombustible() {
  return useQuery({
    queryKey: REQUISICIONES_COMBUSTIBLE_KEY,
    queryFn: () =>
      shareInflight("ot-requisicion-combustible", getRequisicionesCombustible),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useInvalidateRequisicionesCombustible() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: REQUISICIONES_COMBUSTIBLE_KEY });
}

export function useCrearRequisicionCombustible() {
  const invalidate = useInvalidateRequisicionesCombustible();
  return useMutation({
    mutationFn: (input: RequisicionInput) => createRequisicionCombustible(input),
    onSuccess: invalidate,
  });
}

export function useEliminarRequisicionCombustible() {
  const invalidate = useInvalidateRequisicionesCombustible();
  return useMutation({
    mutationFn: (id: string) => deleteRequisicionCombustible(id),
    onSuccess: invalidate,
  });
}
