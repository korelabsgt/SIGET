"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  atenderFalla,
  createFalla,
  getFallasMantenimiento,
  getMecanicos,
  getVehiculosParaFallas,
  solventarFalla,
} from "./actions";
import type {
  AtenderFallaFormData,
  FallaMantenimientoFormData,
  SolventarFallaFormData,
} from "./zod";

const FALLAS_KEY = ["ter-fallas-mantenimiento"];

export function useFallasMantenimiento() {
  return useQuery({
    queryKey: FALLAS_KEY,
    queryFn: getFallasMantenimiento,
  });
}

export function useVehiculosParaFallas() {
  return useQuery({
    queryKey: [...FALLAS_KEY, "vehiculos"],
    queryFn: getVehiculosParaFallas,
  });
}

export function useMecanicos() {
  return useQuery({
    queryKey: [...FALLAS_KEY, "mecanicos"],
    queryFn: getMecanicos,
  });
}

function useInvalidateFallas() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: FALLAS_KEY });
}

export function useCrearFalla() {
  const invalidate = useInvalidateFallas();
  return useMutation({
    mutationFn: (input: FallaMantenimientoFormData) => createFalla(input),
    onSuccess: invalidate,
  });
}

export function useAtenderFalla() {
  const invalidate = useInvalidateFallas();
  return useMutation({
    mutationFn: (input: AtenderFallaFormData) => atenderFalla(input),
    onSuccess: invalidate,
  });
}

export function useSolventarFalla() {
  const invalidate = useInvalidateFallas();
  return useMutation({
    mutationFn: (input: SolventarFallaFormData) => solventarFalla(input),
    onSuccess: invalidate,
  });
}
