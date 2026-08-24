"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { GV_QUERY_OPTIONS, shareInflight } from "../../lib/query";
import { fetchVehiculos } from "../../lib/client-db";
import { createVehiculo, deleteVehiculo, removeVehiculoImagen, updateVehiculo } from "./actions";
import type { VehiculoInput } from "./zod";

export const VEHICULOS_KEY = ["ter-vehiculos"];

export function useVehiculos() {
  return useQuery({
    queryKey: VEHICULOS_KEY,
    queryFn: () => shareInflight("ter-vehiculos", fetchVehiculos),
    ...GV_QUERY_OPTIONS,
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
    mutationFn: async (id: string) => {
      const res = await deleteVehiculo(id);
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: invalidate,
  });
}

export function useQuitarImagenVehiculo() {
  const invalidate = useInvalidateVehiculos();

  return useMutation({
    mutationFn: ({ id, path }: { id: string; path: string }) =>
      removeVehiculoImagen(id, path),
    onSuccess: invalidate,
  });
}
