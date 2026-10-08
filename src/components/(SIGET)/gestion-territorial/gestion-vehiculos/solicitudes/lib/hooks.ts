"use client";



import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";



import { GV_QUERY_OPTIONS, shareInflight } from "../../lib/query";

import { fetchVehiculosDisponibles } from "../../lib/client-db";

import { VEHICULOS_KEY } from "../../flota/lib/hooks";

import {
  createSolicitud,
  fetchProfileBasico,
  getConflictosPreferenciaVehiculo,
  getReservasCalendarioVehiculo,
  getSolicitudes,
  searchProfiles,
} from "./actions";
import type { SolicitudCalendarioConSolicitante } from "./preferencia-vehiculo";

import type { SolicitudInput } from "./zod";



export const SOLICITUDES_KEY = ["ter-solicitudes"];

export const VEHICULOS_DISPONIBLES_KEY = ["ter-vehiculos", "disponibles"] as const;

export const GV_RESERVAS_CALENDARIO_VEHICULO_KEY = "gv-reservas-calendario-vehiculo";



export function useSolicitudes(options?: {

  refetchInterval?: number | false;

  enabled?: boolean;

}) {

  return useQuery({

    queryKey: SOLICITUDES_KEY,

    queryFn: () => shareInflight("ter-solicitudes", getSolicitudes),

    enabled: options?.enabled ?? true,

    ...GV_QUERY_OPTIONS,

    refetchInterval: options?.refetchInterval ?? false,

  });

}



export function useVehiculosParaSolicitud(enabled: boolean) {
  return useQuery({
    queryKey: VEHICULOS_DISPONIBLES_KEY,
    queryFn: () => shareInflight("ter-vehiculos-disponibles", fetchVehiculosDisponibles),
    enabled,
    ...GV_QUERY_OPTIONS,
  });
}



export function useReservasCalendarioVehiculo(vehiculoId: string, enabled: boolean) {
  const id = vehiculoId.trim();
  return useQuery({
    queryKey: [GV_RESERVAS_CALENDARIO_VEHICULO_KEY, id],
    queryFn: () =>
      shareInflight(`${GV_RESERVAS_CALENDARIO_VEHICULO_KEY}:${id}`, async () => {
        const res = await getReservasCalendarioVehiculo(id);
        if (!res.success) throw new Error(res.error);
        return res.data as SolicitudCalendarioConSolicitante[];
      }),
    enabled: enabled && id.length > 0,
    ...GV_QUERY_OPTIONS,
  });
}

export function useProfileBasico(profileId: string, enabled = true) {
  const id = profileId.trim();
  return useQuery({
    queryKey: ["gv-profile-basico", id],
    queryFn: () => shareInflight(`gv-profile-basico:${id}`, () => fetchProfileBasico(id)),
    enabled: enabled && id.length > 0,
    ...GV_QUERY_OPTIONS,
  });
}

export function useSearchProfiles(
  query: string,
  excludeUserId?: string,
  enabled = true,
) {
  const term = query.trim();
  const excluir = excludeUserId?.trim() ?? "";
  return useQuery({
    queryKey: ["gv-search-profiles", term, excluir],
    queryFn: () =>
      shareInflight(`gv-search-profiles:${term}:${excluir}`, () =>
        searchProfiles(term, excluir || undefined),
      ),
    enabled: enabled && term.length >= 3,
    ...GV_QUERY_OPTIONS,
    staleTime: 60_000,
  });
}

export function useConflictosPreferenciaVehiculo(
  fechaInicioIso: string,
  fechaFinIso: string,
  enabled: boolean,
) {
  const listo =
    enabled && fechaInicioIso.length > 0 && fechaFinIso.length > 0;

  return useQuery({
    queryKey: [
      "gv-conflictos-preferencia-vehiculo",
      fechaInicioIso,
      fechaFinIso,
    ],
    queryFn: () =>
      getConflictosPreferenciaVehiculo(fechaInicioIso, fechaFinIso),
    enabled: listo,
    ...GV_QUERY_OPTIONS,
  });
}

export function useCrearSolicitud() {

  const qc = useQueryClient();



  return useMutation({

    mutationFn: (input: SolicitudInput) => createSolicitud(input),

    onSuccess: () => {

      qc.invalidateQueries({ queryKey: SOLICITUDES_KEY });

      qc.invalidateQueries({ queryKey: VEHICULOS_DISPONIBLES_KEY });
      qc.invalidateQueries({ queryKey: ["gv-conflictos-preferencia-vehiculo"] });
      qc.invalidateQueries({ queryKey: [GV_RESERVAS_CALENDARIO_VEHICULO_KEY] });

      qc.invalidateQueries({ queryKey: VEHICULOS_KEY, refetchType: "all" });

    },

  });

}



export function useInvalidateSolicitudes() {

  const qc = useQueryClient();

  return () => {

    qc.invalidateQueries({ queryKey: SOLICITUDES_KEY });

    qc.invalidateQueries({ queryKey: VEHICULOS_DISPONIBLES_KEY });

    qc.invalidateQueries({ queryKey: VEHICULOS_KEY, refetchType: "all" });

  };

}

