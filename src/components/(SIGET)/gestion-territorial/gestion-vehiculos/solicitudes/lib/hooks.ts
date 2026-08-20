"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSolicitud, getSolicitudes } from "./actions";
import type { SolicitudInput } from "./zod";

const SOLICITUDES_KEY = ["ter-solicitudes"];

export function useSolicitudes() {
  return useQuery({
    queryKey: SOLICITUDES_KEY,
    queryFn: getSolicitudes,
  });
}

export function useCrearSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SolicitudInput) => createSolicitud(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOLICITUDES_KEY });
    },
  });
}

export function useInvalidateSolicitudes() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: SOLICITUDES_KEY });
}
