"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  atenderFalla,
  createFalla,
  solventarFalla,
} from "./actions";
import type {
  AtenderFallaFormData,
  FallaMantenimientoFormData,
  SolventarFallaFormData,
} from "./zod";
import { VEHICULOS_KEY } from "../../flota/lib/hooks";
import {
  fetchFallasMantenimiento,
  fetchPerfilesNombre,
  fetchVehiculos,
} from "../../lib/client-db";
import { GV_QUERY_OPTIONS, shareInflight } from "../../lib/query";

export const FALLAS_KEY = ["ter-fallas-mantenimiento"];

export function useFallasMantenimiento() {
  return useQuery({
    queryKey: FALLAS_KEY,
    queryFn: () => shareInflight("ter-fallas", fetchFallasMantenimiento),
    ...GV_QUERY_OPTIONS,
  });
}

export function useVehiculosParaFallas(enabled = true) {
  return useQuery({
    queryKey: VEHICULOS_KEY,
    queryFn: () => shareInflight("ter-vehiculos", fetchVehiculos),
    select: (vehiculos) =>
      vehiculos.map((v) => ({
        id: v.id ?? "",
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        estado: v.estado,
      })),
    enabled,
    ...GV_QUERY_OPTIONS,
  });
}

export function useMecanicos() {
  return useQuery({
    queryKey: [...FALLAS_KEY, "mecanicos"],
    queryFn: () => shareInflight("ter-perfiles-nombre", fetchPerfilesNombre),
    ...GV_QUERY_OPTIONS,
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
