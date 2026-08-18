"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createActividad,
  deleteActividad,
  deleteRegistro,
  getActividad,
  getActividades,
  getParticipantePorDpi,
  getRegistrosActividad,
  buscarDpisRegistrados,
  registrarAsistencia,
  updateActividad,
  updateRegistro,
} from "./actions";
import type { ActividadFormValues, RegistroPublicoValues, RegistroEditValues } from "./zod";

const ACTIVIDADES_KEY = ["asist-actividades"];

export function useActividades() {
  return useQuery({
    queryKey: ACTIVIDADES_KEY,
    queryFn: getActividades,
  });
}

export function useActividad(id: string, enabled = true) {
  return useQuery({
    queryKey: [...ACTIVIDADES_KEY, id],
    queryFn: () => getActividad(id),
    enabled: enabled && !!id,
  });
}

export function useRegistrosActividad(actividadId: string, enabled = true) {
  return useQuery({
    queryKey: ["asist-registros", actividadId],
    queryFn: () => getRegistrosActividad(actividadId),
    enabled: enabled && !!actividadId,
  });
}

function useInvalidateActividades() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ACTIVIDADES_KEY });
  };
}

export function useCrearActividad() {
  const invalidate = useInvalidateActividades();
  return useMutation({
    mutationFn: (values: ActividadFormValues) => createActividad(values),
    onSuccess: invalidate,
  });
}

export function useEditarActividad() {
  const invalidate = useInvalidateActividades();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ActividadFormValues }) =>
      updateActividad(id, values),
    onSuccess: (_data, vars) => {
      invalidate();
      qc.invalidateQueries({ queryKey: [...ACTIVIDADES_KEY, vars.id] });
    },
  });
}

export function useEliminarActividad() {
  const invalidate = useInvalidateActividades();
  return useMutation({
    mutationFn: (id: string) => deleteActividad(id),
    onSuccess: invalidate,
  });
}

export function useBuscarParticipante() {
  return useMutation({
    mutationFn: (dpi: string) => getParticipantePorDpi(dpi),
  });
}

export function useDpisSugerencias(query: string) {
  const digits = query.replace(/\D/g, "");
  return useQuery({
    queryKey: ["asist-dpis-sugerencias", digits],
    queryFn: () => buscarDpisRegistrados(digits),
    enabled: digits.length >= 3,
    staleTime: 60_000,
  });
}

export function useRegistrarAsistencia() {
  return useMutation({
    mutationFn: (values: RegistroPublicoValues) => registrarAsistencia(values),
  });
}

export function useEliminarRegistro(actividadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRegistro(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asist-registros", actividadId] });
      qc.invalidateQueries({ queryKey: ACTIVIDADES_KEY });
    },
  });
}

export function useEditarRegistro(actividadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: RegistroEditValues) => updateRegistro(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asist-registros", actividadId] });
      qc.invalidateQueries({ queryKey: ACTIVIDADES_KEY });
    },
  });
}
