"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createVehiculo,
  deleteVehiculo,
  getVehiculos,
  updateVehiculo,
} from "./actions";
import type { VehiculoInput } from "./zod";

const VEHICULOS_KEY = ["ter-vehiculos"];

export function useVehiculos() {
  return useQuery({
    queryKey: VEHICULOS_KEY,
    queryFn: () => getVehiculos(),
    retry: 1,
  });
}

function useInvalidateVehiculos() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: VEHICULOS_KEY });
}

export function useCrearVehiculo() {
  const invalidate = useInvalidateVehiculos();
  return useMutation({
    mutationFn: (input: VehiculoInput) => createVehiculo(input),
    onSuccess: invalidate,
  });
}

export function useEditarVehiculo() {
  const invalidate = useInvalidateVehiculos();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VehiculoInput }) =>
      updateVehiculo(id, input),
    onSuccess: invalidate,
  });
}

export function useEliminarVehiculo() {
  const invalidate = useInvalidateVehiculos();
  return useMutation({
    mutationFn: (id: string) => deleteVehiculo(id),
    onSuccess: invalidate,
  });
}
