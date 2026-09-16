"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAcuerdo,
  createIncidente,
  createProceso,
  createReporteCiudadano,
  createSesion,
  deleteProceso,
  getJaState,
  resetJaState,
  updateAcuerdo,
  updateIncidente,
  updateProyecto,
  updateSesionFase,
} from "./actions";
import { escribirRolJa, leerRolJa } from "./store";
import type {
  AcuerdoFormValues,
  IncidenteFormValues,
  ProcesoFormValues,
  ProyectoFormValues,
  ReporteCiudadanoFormValues,
  RolJaPersistido,
  SesionFormValues,
} from "./zod";

export const JA_STATE_KEY = ["paz-hidrica-ja"] as const;
export const JA_ROL_KEY = ["paz-hidrica-ja-rol"] as const;

export function useJaState() {
  return useQuery({
    queryKey: JA_STATE_KEY,
    queryFn: getJaState,
  });
}

function useInvalidateJa() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: JA_STATE_KEY });
}

export function useRolJa() {
  return useQuery({
    queryKey: JA_ROL_KEY,
    queryFn: async (): Promise<RolJaPersistido> => leerRolJa(),
  });
}

export function useSetRolJa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rol: RolJaPersistido) => {
      escribirRolJa(rol);
      return rol;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JA_ROL_KEY });
    },
  });
}

export function useCrearIncidente() {
  const invalidate = useInvalidateJa();
  return useMutation({
    mutationFn: (values: IncidenteFormValues) => createIncidente(values),
    onSuccess: invalidate,
  });
}

export function useEditarIncidente() {
  const invalidate = useInvalidateJa();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: IncidenteFormValues }) =>
      updateIncidente(id, values),
    onSuccess: invalidate,
  });
}

export function useCrearSesion() {
  const invalidate = useInvalidateJa();
  return useMutation({
    mutationFn: (values: SesionFormValues) => createSesion(values),
    onSuccess: invalidate,
  });
}

export function useCambiarFaseSesion() {
  const invalidate = useInvalidateJa();
  return useMutation({
    mutationFn: ({ id, fase }: { id: string; fase: SesionFormValues["fase"] }) =>
      updateSesionFase(id, fase),
    onSuccess: invalidate,
  });
}

export function useCrearAcuerdo() {
  const invalidate = useInvalidateJa();
  return useMutation({
    mutationFn: (values: AcuerdoFormValues) => createAcuerdo(values),
    onSuccess: invalidate,
  });
}

export function useEditarAcuerdo() {
  const invalidate = useInvalidateJa();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AcuerdoFormValues }) =>
      updateAcuerdo(id, values),
    onSuccess: invalidate,
  });
}

export function useEditarProyecto() {
  const invalidate = useInvalidateJa();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProyectoFormValues }) =>
      updateProyecto(id, values),
    onSuccess: invalidate,
  });
}

export function useCrearProceso() {
  const invalidate = useInvalidateJa();
  return useMutation({
    mutationFn: (values: ProcesoFormValues) => createProceso(values),
    onSuccess: invalidate,
  });
}

export function useQuitarProceso() {
  const invalidate = useInvalidateJa();
  return useMutation({
    mutationFn: (id: string) => deleteProceso(id),
    onSuccess: invalidate,
  });
}

export function useCrearReporteCiudadano() {
  const invalidate = useInvalidateJa();
  return useMutation({
    mutationFn: (values: ReporteCiudadanoFormValues) => createReporteCiudadano(values),
    onSuccess: invalidate,
  });
}

export function useReiniciarJa() {
  const invalidate = useInvalidateJa();
  return useMutation({
    mutationFn: () => resetJaState(),
    onSuccess: invalidate,
  });
}
